import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movies.entity';
import { FullMovieDto } from './dto/full.movie.dto';
// import { GetMovieDto } from './dto/getMovie.dto';
// import { AUTH_SERVICE, GENRES_SERVICE } from "./constants/services";
// import { COMMENTS_SERVICE } from "./constants/services";
// import { PERSONS_SERVICE } from "./constants/services";
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { CountriesList } from './constants/countries.list';

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
      if (responseFromGenres.length) {
        movies.andWhere(`id in (:...ids)`, { ids: responseFromGenres });
        //rawGenresPersonsArray.push(temp);
      }
    }

    if (dto.director) {
      const responseFromPerson = await lastValueFrom(
        this.personsClient.send(
          { cmd: 'getIdsByDirector' },
          { role: 'director', name: dto.director },
        ),
      );
      if (responseFromPerson) {
        movies.andWhere(`id in (:...ids)`, { ids: responseFromPerson });
      }
    }

    if (dto.actor) {
      const responseFromPerson = await lastValueFrom(
        this.personsClient.send(
          { cmd: 'getIdsByActor' },
          { role: 'actor', name: dto.actor },
        ),
      );

      if (responseFromPerson) {
        movies.andWhere(`id in (:...ids)`, { ids: responseFromPerson });
      }
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

    if (dto.ratingcount) {
      movies.andWhere('"ratingcount" >= :ratingcount', {
        ratingcount: dto.ratingcount,
      });
    }

    if (dto.partName) {
      movies.andWhere('nameru like :nameru', {
        nameru: '%' + dto.partName + '%',
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
    console.log(0);
    //преобразуем полный список в минимувис для выдачи, пока без жанров и персон
    const result: MiniMovieDto[] = [];
    rawResult.forEach((movie) => {
      const tempMovie: MiniMovieDto = {
        id: undefined,
        nameru: undefined,
        nameen: undefined,
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
    console.log(1);
    // извлекаем ids результата для использования ниже в запросах к микросервисам
    //TO DO сделать прверку на пустой result
    const resultIds = result.map((movie) => movie.id);
    // запрашиваем жанры для обогащения нашей поисковой выдачи
    const genresMap: Map<number, string> = new Map(
      await lastValueFrom(
        this.genresClient.send({ cmd: 'getGenreById' }, resultIds),
      ),
    );
    /* return [
    [41507, 'Ужас'],
  [419709,'Комедия']
]*/
    console.log(2);
    // обогащаем результат жанрами
    result.forEach((value) => {
      value.genres = genresMap.get(value.id);
    });
    console.log(3);
    return { result: result, amount: amountOfMovies };
  }

  async createMovie(dto: FullMovieDto) {
    console.log('Movies MS - Service - createMovie at', new Date());
    /*
    let shortDto: Movie;
    for (const shortDtoElement in shortDto) {
      const fieldName = Object.keys(shortDtoElement)[0];
      shortDto[fieldName] = dto[fieldName];
    }*/

    /*    const shortDto = Object.create(Movie);
    Object.entries(shortDto).forEach((value) => {
      dto[value[0]] = value[1];
    });*/

    //TODO как это можно сделать по человечески?
    const shortDto: Movie = {
      id: dto.id,
      nameru: dto.nameru,
      nameen: dto.nameen,
      type: dto.type,
      description: dto.description,
      country: dto.country,
      trailer: dto.trailer,
      similarmovies: dto.similarmovies,
      year: dto.year,
      rating: dto.rating,
      ratingcount: dto.ratingcount,
      agerating: dto.agerating,
      poster: dto.poster,
      duration: dto.duration,
      slogan: dto.slogan,
    };

    const movie = await this.moviesRepository.save(shortDto);
    const errors = [];
    const genres = await lastValueFrom(
      this.genresClient.emit('setGenresToMovie', {
        movie_id: movie.id,
        genres: dto.genres,
      }),
    ).catch((e) => errors.push(e));

    const persons = await lastValueFrom(
      this.personsClient.send('setPersonsToMovie', {
        id: movie.id,
        director: dto.director,
        actors: dto.actors,
        producer: dto.producer,
        cinematographer: dto.cinematographer,
        screenwriter: dto.screenwriter,
        composer: dto.composer,
      }),
    ).catch((e) => errors.push(e));
    console.log(`genres: ${genres}, persons: ${persons}`);
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
      this.genresClient.send({ cmd: 'getGenreById' }, movie.id),
    ).catch((e) => errors.push({ genres: e }));

    const persons = await lastValueFrom(
      this.personsClient.send({ cmd: 'getPersonsByMovieId' }, movie.id),
    ).catch((e) => {
      errors.push({ persons: e });
    });
    console.log(persons);

    const fullMovie = Object.create(FullMovieDto);
    Object.entries(movie).forEach((value) => {
      fullMovie[value[0]] = value[1];
    });

    //заполняем similarMovies миниМувисами вместо ids

    if (fullMovie.similarmovies && fullMovie.similarmovies.length) {
      const tempFilter = Object.create(MovieFilterDto);
      tempFilter.ids = fullMovie.similarmovies;
      fullMovie.similarmovies = (await this.getMovies(tempFilter)).result;
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
    console.log('Movies MS - Service - createMovie at', new Date());
    const errors = [];
    await lastValueFrom(
      this.genresClient.send({ cmd: 'deleteMovieFromGenres' }, id),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.emit({ cmd: 'deleteMovieFromPersons' }, id),
    ).catch((e) => errors.push({ persons: e }));

    await lastValueFrom(
      this.commentsClient.emit('deleteCommentsFromEssence', {
        dto: { essenceTable: 'movies', essenceId: id },
      }),
    ).catch((e) => errors.push({ comments: e }));

    await lastValueFrom(
      this.filesClient.send('deleteFilesFromEssence', {
        dto: { essenceTable: 'movies', essenceId: id },
      }),
    ).catch((e) => errors.push({ files: e }));

    const result = await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: id })
      .execute()
      .catch((e) =>
        errors.push({
          movies: e,
        }),
      );
    return { result: result, errors: errors };
  }

  async editMovie(dto: FullMovieDto) {
    console.log('Movies MS - Service - editMovie at', new Date());

    const errors = [];
    const edit = await this.moviesRepository.createQueryBuilder().update().set({
      id: dto.id,
      nameru: dto.nameru,
      nameen: dto.nameen,
      type: dto.type,
      description: dto.description,
      country: dto.country,
      trailer: dto.trailer,
      similarmovies: dto.similarmovies,
      year: dto.year,
      rating: dto.rating,
      ratingcount: dto.ratingcount,
      agerating: dto.agerating,
      poster: dto.poster,
      duration: dto.duration,
      slogan: dto.slogan,
    });

    await lastValueFrom(
      this.genresClient.send(
        { cmd: 'updateGenre' },
        { movieId: dto.id, genres: dto.genres },
      ),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.send(
        { cmd: 'editPersonsInMovie' },
        {
          director: dto.director,
          actors: dto.actors,
          producer: dto.producer,
          cinematographer: dto.cinematographer,
          screenwriter: dto.screenwriter,
          composer: dto.composer,
        },
      ),
    ).catch((e) => errors.push({ persons: e }));

    edit.where('id=:id', { id: dto.id });
    const result = await edit.execute().catch((e) =>
      errors.push({
        movies: e,
      }),
    );
    return { result: result, errors: errors };
  }
}
