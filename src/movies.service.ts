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
// import { PersonsDto } from './dto/persons.dto';
import { CountriesList } from './constants/countries.list';

// import { GenresDto } from './dto/genres.dto';

@Injectable()
export class MoviesService {
  constructor(
    @Inject('GENRES') private genresClient: ClientProxy,
    @Inject('PERSONS') private personsClient: ClientProxy,
    @Inject('AUTH') private authClient: ClientProxy,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Service - getMovies at', new Date());
    let orderDirection;
    const sortMap = new Map([
      ['name', 'nameRu'],
      ['rating', 'rating'],
      ['ratingCount', 'ratingCount'],
    ]);
    let ids: number[];
    let rawGenresPersonsArray: number[][];

    const movies = await this.moviesRepository.createQueryBuilder();

    /*
        if (!getGenres) {
          movies.andWhere(`id in (:...genres)`, { genres: getGenres });
        }
    */

    if (dto.genre) {
      rawGenresPersonsArray.push(
        await lastValueFrom(
          this.genresClient.send({ cmd: 'getIdsByGenres' }, dto.genre),
        ),
      );
    }

    if (dto.director) {
      rawGenresPersonsArray.push(
        await lastValueFrom(
          this.personsClient.send({ cmd: 'getIdsByDirector' }, dto.director),
        ),
      );
    }

    if (dto.actor) {
      rawGenresPersonsArray.push(
        await lastValueFrom(
          this.personsClient.send({ cmd: 'getIdsByActor' }, dto.actor),
        ),
      );
    }

    // пересекаем полученные массивы, получаем перечень id, по которым надо фильтровать
    if (rawGenresPersonsArray.length == 1) {
      ids = rawGenresPersonsArray[0];
    } else if (rawGenresPersonsArray.length > 1) {
      ids = rawGenresPersonsArray[0].filter((v) =>
        rawGenresPersonsArray[1].includes(v),
      );
      if (rawGenresPersonsArray.length == 3) {
        ids = rawGenresPersonsArray[2].filter((v) => ids.includes(v));
      }
    }

    if (ids) {
      movies.andWhere(`id in (:...ids)`, { ids: ids });
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
      movies.andWhere('name like :name', { name: '%' + dto.partName + '%' });
    }

    if (dto.year) {
      const years = dto.year.split('-');
      movies.andWhere('year >= :start', { start: years[0] });
      if (years[1]) {
        movies.andWhere('year <= :end', { end: years[1] });
      }
    }

    if (dto.country) {
      const temp = dto.country.split('+');
      const countries = [];
      temp.forEach((c) =>
        countries.push({ name: CountriesList.get(c).nameRu }),
      );
      movies.andWhere('countries&&:c', { c: countries });
    }

    //если не пришёл порядок сортировки - сортируем по id
    const order = sortMap[dto.sort] || 'id';

    //если не пришло направление сортировки - сортируем по возрастанию
    if (!orderDirection) orderDirection = 'ASC';

    //если не пришла пагинация - выдаём первую страницу, 10 записей
    const pagination = dto.pagination.length > 0 ? dto.pagination : [0, 10];

    // выбираем поля, необходимые для формирования miniMovies
    movies.select([
      'id',
      'nameRu',
      'nameEn',
      'poster',
      'rating',
      'startYear',
      'country',
      'duration',
    ]);
    /* movies.take(pagination[1]);
     movies.skip(pagination[0] * pagination[1]);
     movies.orderBy(order, orderDirection);*/

    //получаем полный результат для того, чтобы получить количество записей
    const rawListOfMovies: Movie[] = await movies.getMany();

    //получаем общее количество записей
    const amountOfMovies = rawListOfMovies.length;

    //формируем результирующий массив с учётом пагинации, но без жанров и персон
    const rawResult: Movie[] = rawListOfMovies.slice(
      pagination[0] * pagination[1],
      pagination[0] * pagination[1] + pagination[1] + 1,
    );
    //------------------------------тут надо проверить пагинацию на граничные значения

    //преобразуем полный список в минимувис для выдачи, пока без жанров и персон
    let result: MiniMovieDto[];
    rawResult.forEach((movie) => {
      let tempMovie: MiniMovieDto;
      for (const tempMovieKey in tempMovie) {
        tempMovie[tempMovieKey] = movie[tempMovieKey];
      }
    });

    // извлекаем ids результата для использования ниже в запросах к микросервисам
    const resultIds = result.map((movie) => movie.id);

    // запрашиваем жанры для обогащения нашей поисковой выдачи
    const genresMap = new Map(
      await lastValueFrom(this.genresClient.send('getGenresByIds', resultIds)),
    );

    // обогащаем результат жанрами
    result.forEach((value) => {
      value.genres = genresMap[value.id];
    });

    return { result: result, amount: amountOfMovies };
  }

  async createMovie(dto: FullMovieDto) {
    console.log('Movies MS - Service - createMovies at', new Date());
    let shortDto: Movie;
    for (const shortDtoElement in shortDto) {
      const fieldName = Object.keys(shortDtoElement)[0];
      shortDto[fieldName] = dto[fieldName];
    }

    const movie = await this.moviesRepository.save(shortDto);

    this.genresClient.send('setGenresToMovie', {
      movie_id: movie.id,
      genres: dto.genres,
    });

    this.personsClient.send('setPersonsToMovie', {
      id: dto.id,
      director: dto.director,
      actors: dto.actors,
      producer: dto.producer,
      cinematographer: dto.cinematographer,
      screenwriter: dto.screenwriter,
      composer: dto.composer,
    });

    return movie;
  }

  async getMovieById(id: number): Promise<FullMovieDto> {
    console.log('Movies MS - Service - getMovieById at', new Date());

    const movie = await this.moviesRepository.findOne({ where: { id: id } });
    const genres = await lastValueFrom(
      this.genresClient.send('getGenreByMovieId', movie.id),
    );

    const persons = await lastValueFrom(
      this.personsClient.send('getPersonsByMovieId', movie.id),
    );

    let fullMovie: FullMovieDto;
    Object.entries(movie).forEach((value) => {
      fullMovie[value[0]] = value[1];
    });

    //заполняем similarMovies миниМувисами вместо ids
    let tempFilter: MovieFilterDto;
    tempFilter.ids = fullMovie.similarMovies;
    fullMovie.similarMovies = (await this.getMovies(tempFilter)).result;

    // заполняем данными, полученными от микросервисов жанры/персоны
    fullMovie.genres = genres;
    fullMovie.director = persons.director;
    fullMovie.actors = persons.actors;
    fullMovie.producer = persons.producer;
    fullMovie.cinematographer = persons.cinematographer;
    fullMovie.screenwriter = persons.screenwriter;
    fullMovie.composer = persons.composer;

    return fullMovie;
  }

  async deleteMovie(id: number) {
    console.log('Movies MS - Service - createMovie at', new Date());

    this.genresClient.emit({ cmd: 'deleteMovieFromGenres' }, id);

    this.personsClient.emit({ cmd: 'deleteMovieFromPersons' }, id);

    return await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: id })
      .execute();
  }

  async editMovie(dto: FullMovieDto) {
    const edit = await this.moviesRepository.createQueryBuilder().update().set({
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
    });

    this.genresClient.emit(
      { cmd: 'editGenresInMovie' },
      { movieId: dto.id, genres: dto.genres },
    );

    this.personsClient.emit(
      { cmd: 'editPersonsInMovie' },
      {
        director: dto.director,
        actors: dto.actors,
        producer: dto.producer,
        cinematographer: dto.cinematographer,
        screenwriter: dto.screenwriter,
        composer: dto.composer,
      },
    );

    edit.where('id=:id', { id: dto.id });
    return await edit.execute();
  }
}
