import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movies.entity';
import { FullMovieDto } from './dto/full.movie.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { CountriesList } from './constants/countries.list';
import { GenresDto } from './dto/genres.dto';
import { UpdateMovieDto } from './dto/update.movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @Inject('GENRES') private genresClient: ClientProxy,
    @Inject('PERSONS') private personsClient: ClientProxy,
    @Inject('FILES') private filesClient: ClientProxy,
    @Inject('COMMENTS') private commentsClient: ClientProxy,
    @Inject('AUTH') private authClient: ClientProxy,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Service - getMovies at', new Date());

    const movies = await this.moviesRepository.createQueryBuilder();

    if (dto.genre) {
      const responseFromGenres: any[] = await lastValueFrom(
        this.genresClient.send(
          { cmd: 'getMoviesByGenres' },
          { genres: dto.genre.split(' ') },
        ),
      );
      if (!responseFromGenres.length) {
        return { result: [], amount: 0 };
      }
      movies.andWhere(`id in (:...ids)`, { ids: responseFromGenres });
    }

    if (dto.director) {
      const responseFromPerson: number[] = await lastValueFrom(
        this.personsClient.send(
          { cmd: 'getIdsByDirector' },
          { role: 'director', name: dto.director },
        ),
      );
      if (!responseFromPerson.length) {
        return { result: null, amount: 0 };
      }
      movies.andWhere(`id in (:...ids)`, { ids: responseFromPerson });
    }

    if (dto.actor) {
      const responseFromPerson = await lastValueFrom(
        this.personsClient.send(
          { cmd: 'getIdsByActor' },
          { role: 'actor', name: dto.actor },
        ),
      );

      if (!responseFromPerson) {
        return { result: null, amount: 0 };
      }

      movies.andWhere(`id in (:...ids)`, { ids: responseFromPerson });
    }

    if (dto.ids) {
      //если ids приходит от клиента, а не от локальной функции, нам надо из строки привести его к массиву
      if (typeof dto.ids == 'string') {
        dto.ids = dto.ids.split(' ').map((value) => parseInt(value, 10));
      }

      movies.andWhere(`id in (:...ids)`, { ids: dto.ids });
    }

    if (dto.rating) {
      movies.andWhere('"rating" >= :rating', { rating: dto.rating });
    }

    if (dto.ratingCount) {
      movies.andWhere('"ratingCount" >= :ratingCount', {
        ratingCount: dto.ratingCount,
      });
    }

    if (dto.partName) {
      movies.andWhere('"nameRu" like :nameRu', {
        nameRu: '%' + dto.partName + '%',
      });
    }

    if (dto.year) {
      const years = dto.year.split('-');
      movies.andWhere('year >= :start', { start: years[0] });
      if (years[1]) {
        movies.andWhere('year <= :end', { end: years[1] });
      }
    }

    if (dto.country) {
      const temp = dto.country.split(' ');
      const countries = [];
      temp.forEach((c) =>
        // countries.push({ name: CountriesList.get(c).nameRu }),
        countries.push(CountriesList.get(c).nameRu),
      );

      movies.andWhere(`string_to_array(country,',')&&:c::text[]`, {
        c: countries,
      });
    }

    //если не пришёл порядок сортировки - сортируем по id
    const order = dto.sort || 'id';

    movies.orderBy(order, 'ASC');

    //если не пришла пагинация - выдаём первую страницу, 10 записей
    const pagination: number[] = [0, 10];
    if (dto.pagination) {
      const temp: string[] = dto.pagination.split(':');
      pagination[0] = parseInt(temp[0]);
      pagination[1] = parseInt(temp[1]);
    }

    //получаем полный результат для того, чтобы получить количество записей

    const rawListOfMovies = await movies.getMany();
    //получаем общее количество записей
    const amountOfMovies = rawListOfMovies.length;

    //проверяем, что фильмов в выдаче больше нуля
    if (!amountOfMovies) return { result: null, amount: amountOfMovies };

    //формируем результирующий массив с учётом пагинации, но без жанров и персон
    if (amountOfMovies < pagination[1]) {
      pagination[1] = amountOfMovies;
    } else if (amountOfMovies - (pagination[0] + 1) * pagination[1] < 0) {
      pagination[1] = amountOfMovies - pagination[0] * pagination[1];
    }

    const rawResult: Movie[] = rawListOfMovies.slice(
      pagination[0] * pagination[1],
      pagination[0] * pagination[1] + pagination[1] + 1,
    );

    //преобразуем полный список в минимувис для выдачи, пока без жанров и персон
    const result: MiniMovieDto[] | null = [];
    rawResult.forEach((movie) => {
      const tempMovie: MiniMovieDto = {
        id: undefined,
        nameRu: undefined,
        nameEn: undefined,
        poster: undefined,
        rating: undefined,
        year: undefined,
        country: undefined,
        genres: undefined,
        duration: undefined,
      };
      for (const tempMovieKey in tempMovie) {
        tempMovie[tempMovieKey] = movie[tempMovieKey];
      }
      result.push(tempMovie);
    });

    // извлекаем ids результата для использования ниже в запросах к микросервисам

    const resultIds = result.map((movie) => movie.id);

    // запрашиваем жанры для обогащения нашей поисковой выдачи
    const genresMap: Map<number, GenresDto[]> = new Map(
      await lastValueFrom(
        this.genresClient.send({ cmd: 'getGenreById' }, resultIds),
      ),
    );

    // обогащаем результат жанрами
    result.forEach((value) => {
      value.genres = genresMap.get(value.id);
    });
    return { result: result, amount: amountOfMovies };
  }

  async createMovie(dto: FullMovieDto) {
    console.log('Movies MS - Service - createMovie at', new Date());

    //TODO как это можно сделать по человечески?
    const shortDto: Movie = {
      id: dto.id,
      nameRu: dto.nameRu,
      nameEn: dto.nameEn,
      type: dto.type,
      description: dto.description,
      country: dto.country,
      trailer: dto.trailer,
      similarMovies: dto.similarMovies,
      year: dto.year,
      rating: dto.rating,
      ratingCount: dto.ratingCount,
      ageRating: dto.ageRating,
      poster: dto.poster,
      duration: dto.duration,
      slogan: dto.slogan,
    };

    const movie = await this.moviesRepository.save(shortDto);
    const errors = [];
    const genres = await lastValueFrom(
      this.genresClient.send(
        { cmd: 'addGenresToMovie' },
        {
          movieId: movie.id,
          genres: dto.genres,
        },
      ),
    ).catch((e) => errors.push({ genres: e }));

    const persons = await lastValueFrom(
      this.personsClient.send(
        { cmd: 'setPersonsToMovie' },
        {
          id: movie.id,
          director: dto.director,
          actors: dto.actors,
          producer: dto.producer,
          cinematographer: dto.cinematographer,
          screenwriter: dto.screenwriter,
          composer: dto.composer,
        },
      ),
    ).catch((e) => errors.push({ persons: e }));
    console.log(`genres: ${genres}, persons: ${persons}`);
    return { movie: movie, errors: errors };
  }

  async getMovieById(id: number): Promise<any> {
    console.log('Movies MS - Service - getMovieById at', new Date());
    if (id == 50) return 100;
    const errors = [];

    const movie = await this.moviesRepository
      .findOne({ where: { id: id } })
      .catch((e) => {
        return e;
      });

    if (movie === null)
      return { movie: {}, errors: [{ movie: 'Movie not found' }] };

    const genres = await lastValueFrom(
      this.genresClient.send({ cmd: 'getGenreById' }, movie.id),
    ).catch((e) => errors.push({ genres: e }));

    const persons = await lastValueFrom(
      this.personsClient.send({ cmd: 'getPersonsByMovieId' }, movie.id),
    ).catch((e) => {
      errors.push({ persons: e });
    });

    const fullMovie = Object.create(FullMovieDto);
    Object.entries(movie).forEach((value) => {
      fullMovie[value[0]] = value[1];
    });

    //заполняем similarMovies миниМувисами вместо ids

    if (fullMovie.similarMovies && fullMovie.similarMovies.length) {
      const tempFilter = Object.create(MovieFilterDto);
      tempFilter.ids = fullMovie.similarMovies;
      fullMovie.similarMovies = (await this.getMovies(tempFilter)).result;
    }
    // заполняем данными, полученными от микросервисов жанры/персоны
    if (genres) fullMovie.genres = genres;
    if (persons) {
      fullMovie.director = persons.director;
      fullMovie.actors = persons.actors;
      fullMovie.producer = persons.producer;
      fullMovie.cinematographer = persons.cinematographer;
      fullMovie.screenwriter = persons.screenwriter;
      fullMovie.composer = persons.composer;
    }

    return { movie: fullMovie, errors: errors };
  }

  async deleteMovie(id: number) {
    console.log('Movies MS - Service - deleteMovie at', new Date());

    const errors = [];
    const result: any = await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: id })
      .execute()
      .catch((e) =>
        errors.push({
          movies: e,
        }),
      );

    if (result.affected == 0)
      errors.push({ movies: 'Movie with this number not found' });
    if (errors) return { result: {}, errors: errors };

    await lastValueFrom(
      this.genresClient.send({ cmd: 'deleteMovieFromGenres' }, { movieId: id }),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.send({ cmd: 'deleteMovieFromPersons' }, id),
    ).catch((e) => errors.push({ persons: e }));

    await lastValueFrom(
      this.commentsClient.send(
        { cmd: 'deleteCommentsFromEssence' },
        {
          dto: { essenceTable: 'movies', essenceId: id },
        },
      ),
    ).catch((e) => errors.push({ comments: e }));

    await lastValueFrom(
      this.filesClient.send(
        { cmd: 'deleteFiles' },
        {
          dto: { essenceTable: 'movies', essenceId: id },
        },
      ),
    ).catch((e) => errors.push({ files: e }));

    return { result: result, errors: errors };
  }

  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    console.log('Movies MS - Service - editMovie at', new Date());
    const errors = [];
    const edit = await this.moviesRepository.createQueryBuilder().update().set({
      id: movieId,
      nameRu: updateMovieDto.nameRu,
      nameEn: updateMovieDto.nameEn,
      type: updateMovieDto.type,
      description: updateMovieDto.description,
      country: updateMovieDto.country,
      trailer: updateMovieDto.trailer,
      similarMovies: updateMovieDto.similarMovies,
      year: updateMovieDto.year,
      rating: updateMovieDto.rating,
      ratingCount: updateMovieDto.ratingCount,
      ageRating: updateMovieDto.ageRating,
      poster: updateMovieDto.poster,
      duration: updateMovieDto.duration,
      slogan: updateMovieDto.slogan,
    });
    await lastValueFrom(
      this.genresClient.send(
        { cmd: 'addGenresToMovie' },
        { movieId: movieId, genres: updateMovieDto.genres },
      ),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.send(
        { cmd: 'editPersonsInMovie' },
        {
          id: movieId,
          director: updateMovieDto.director,
          actors: updateMovieDto.actors,
          producer: updateMovieDto.producer,
          cinematographer: updateMovieDto.cinematographer,
          screenwriter: updateMovieDto.screenwriter,
          composer: updateMovieDto.composer,
        },
      ),
    ).catch((e) => errors.push({ persons: e }));

    edit.where('id=:id', { id: movieId });
    const result = await edit.execute().catch((e) =>
      errors.push({
        movies: e,
      }),
    );

    return { result: result, errors: errors };
  }
}
