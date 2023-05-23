import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movies.entity';
import { FullMovieDto } from './dto/full.movie.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { UpdateMovieDto } from './dto/update.movie.dto';
import { CountriesService } from './countries/countries.service';
import { GenresDto } from './dto/genres.dto';

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
    private countriesService: CountriesService,
  ) {}

  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Service - getMovies at', new Date());
    const movies = await this.moviesRepository.createQueryBuilder();
    if (dto.genres) {
      const responseFromGenres: any[] = await lastValueFrom(
        this.genresClient.send(
          { cmd: 'getMoviesByGenres' },
          { genres: dto.genres.split(' ') },
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
          { cmd: 'getIdsByPerson' },
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
          { cmd: 'getIdsByPerson' },
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
      if (years.length == 1) years[1] = years[0];

      // проверяем условие 1980 (если пришёл 1980 год, то ищем всё до 1980 года)
      if (!(years[0] == years[1] && years[0] == '1980'))
        movies.andWhere('year >= :start', { start: years[0] });

      if (years[1]) {
        movies.andWhere('year <= :end', { end: years[1] });
      }
    }

    /* if (dto.country) {
      const temp = dto.country.split(' ');
      const countries = [];
      temp.forEach((c) =>
        // countries.push({ name: CountriesList.get(c).nameRu }),
        countries.push(CountriesList.get(c).nameRu),
      );

      movies.andWhere(`string_to_array(country,',')&&:c::text[]`, {
        c: countries,
      });
    }*/

    //если не пришёл порядок сортировки - сортируем по id
    const order = dto.sort || 'id';

    movies.orderBy(order, 'ASC');

    //если не пришла пагинация - выдаём первую страницу, 35 записей
    const pagination = [1, 35]; //todo упростил функционал, теперь надо упростить код
    if (dto.page) {
      pagination[0] = dto.page;
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
    } else if (amountOfMovies - pagination[0] * pagination[1] < 0) {
      pagination[1] = amountOfMovies - pagination[0] * pagination[1];
    }

    const rawResult: Movie[] = rawListOfMovies.slice(
      (pagination[0] - 1) * pagination[1],
      pagination[0] * pagination[1] + pagination[1],
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
        this.genresClient.send(
          { cmd: 'getGenresByMoviesIds' },
          { movies: resultIds },
        ),
      ),
    );

    // обогащаем результат жанрами и странами
    // todo передалать страны и жанры на получение массива от сервиса
    for (const movie of result) {
      movie.genres = genresMap.get(movie.id);
      const countries = await this.countriesService.getCountriesByMovie({
        movieId: [movie.id],
      });
      movie.country = countries[1];
    }

    return { result: result, amount: amountOfMovies };
  }

  async createMovie(dto: FullMovieDto) {
    console.log('Movies MS - Service - createMovie at', new Date());
    //TODO как это можно сделать по человечески?
    const shortDto: Movie = {
      id: dto.id,
      nameRu: dto.nameRu,
      nameEn: dto.nameEn,
      description: dto.description,
      countries: dto.country,
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

    /*   const persons = await lastValueFrom(
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
   */

    await this.countriesService.addCountriesToMovie({
      movieId: movie.id,
      countries: dto.country,
    });

    return { movie: movie, errors: errors };
  }

  async getMovieById(id: number): Promise<any> {
    console.log('Movies MS - Service - getMovieById at', new Date());
    const errors = [];

    const movie = await this.moviesRepository
      .findOne({ where: { id: id } })
      .catch((e) => {
        return e;
      });

    if (movie === null)
      return { movie: {}, errors: [{ movie: 'Movie not found' }] };

    const genres = await lastValueFrom(
      this.genresClient.send(
        { cmd: 'getGenresByMoviesIds' },
        { movies: [movie.id] },
      ),
    ).catch((e) => errors.push({ genres: e }));

    /*  const persons = await lastValueFrom(
        this.personsClient.send(
          { cmd: 'getPersonsByMovieId' },
          { movies: [movie.id] },
        ),
      ).catch((e) => {
        errors.push({ persons: e });
      });*/

    //todo посмотреть на свежую голову, как оптимизировать этот участок
    const countries = await this.countriesService.getCountriesByMovie({
      movieId: [id],
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
    // заполняем данными, полученными от микросервисов жанры/персоны и странами
    if (genres) fullMovie.genres = genres[0][1];
    if (countries) fullMovie.countries = countries[1];
    /* if (persons) {todo включить, когда будут  персоны
      fullMovie.director = persons.director;
      fullMovie.actors = persons.actors;
      fullMovie.producer = persons.producer;
      fullMovie.cinematographer = persons.cinematographer;
      fullMovie.screenwriter = persons.screenwriter;
      fullMovie.composer = persons.composer;
    }*/

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

    if (result.affected == 0) errors.push({ movies: 'Error' });

    if (errors.length) return { result: {}, errors: errors };

    await lastValueFrom(
      this.genresClient.send({ cmd: 'deleteMovieFromGenres' }, { movieId: id }),
    ).catch((e) => errors.push({ genres: e }));
    /* todo включить когда будут персоны

    await lastValueFrom(
      this.personsClient.send({ cmd: 'deleteMovieFromPersons' }, id),
    ).catch((e) => errors.push({ persons: e }));
*/
    /* await lastValueFrom(
       this.commentsClient.send(
         { cmd: 'deleteCommentsFromEssence' },
         {
           dto: { essenceTable: 'movies', essenceId: id },
         },
       ),
     ).catch((e) => errors.push({ comments: e }));*/ //todo warning

    /*  await lastValueFrom(
      this.filesClient.send(
        { cmd: 'deleteFiles' },
        {
          dto: { essenceTable: 'movies', essenceId: id },
        },
      ),
    ).catch((e) => errors.push({ files: e }));*/ //todo включить когда будут файлы

    return { result: result, errors: errors };
  }

  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    console.log('Movies MS - Service - editMovie at', new Date());
    const errors = [];
    const edit = await this.moviesRepository.createQueryBuilder().update().set({
      id: movieId,
      nameRu: updateMovieDto.nameRu,
      nameEn: updateMovieDto.nameEn,
      description: updateMovieDto.description,
      // country: updateMovieDto.country,
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
    //todo скорее всего здесь надо сделать другой метод.. надо проверить
    await this.countriesService.addCountriesToMovie({
      movieId: movieId,
      countries: updateMovieDto.countries,
    });
    /*
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
        ).catch((e) => errors.push({ persons: e }));*/

    edit.where('id=:id', { id: movieId });
    const result = await edit.execute().catch((e) =>
      errors.push({
        movies: e,
      }),
    );

    return { result: result, errors: errors };
  }

  async getAllCountries() {
    console.log('Movies MS - Service - getAllCountries at', new Date());
    return await this.countriesService.getAllCountries();
  }

  async fillCountries() {
    console.log('Movies MS - Service - fillCountries at', new Date());

    return this.countriesService.createCountry();
  }
}
