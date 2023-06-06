import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Movie } from './movies.entity';
import { FullMovieDto } from './dto/full.movie.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { UpdateMovieDto } from './dto/update.movie.dto';
import { CountriesService } from './countries/countries.service';
import { GenresDto } from './dto/genres.dto';
import { FullMoviePersonsDto } from './dto/full.movie.persons.dto';
import { CountryDto } from './countries/dto/country.dto';
import { Country } from './countries/entity/country.entity';
import { PersonsDto } from './dto/persons.dto';

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

  async getMoviesRepository(): Promise<Repository<Movie>> {
    return this.moviesRepository;
  }

  async getMoviesByGenresMS(dto: MovieFilterDto): Promise<number[]> {
    return await lastValueFrom(
      this.genresClient.send(
        { cmd: 'getMoviesByGenres' },
        { genres: dto.genres.split('+') },
      ),
    );
  }

  async getMoviesByPersonsMS(
    dto: MovieFilterDto,
    filmRole: string,
  ): Promise<number[]> {
    return await lastValueFrom(
      this.personsClient.send(
        { cmd: `getMoviesBy${filmRole}` },
        { personId: filmRole == 'Actor' ? dto.actor : dto.director },
      ),
    );
  }

  async getGenresByMoviesIds(
    resultIds: number[],
  ): Promise<[number, GenresDto[]][]> {
    return await lastValueFrom(
      this.genresClient.send(
        { cmd: 'getGenresByMoviesIds' },
        { movies: resultIds },
      ),
    );
  }

  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Service - getMovies at', new Date());
    const movies = await this.moviesRepository.createQueryBuilder('movies');

    if (dto.genres) {
      const responseFromGenres: any[] = await this.getMoviesByGenresMS(dto);
      if (!responseFromGenres.length) {
        return { result: [], amount: 0 };
      }
      movies.andWhere(`id in (:...ids)`, { ids: responseFromGenres });
    }

    if (dto.director) {
      const responseFromPerson: number[] = await this.getMoviesByPersonsMS(
        dto,
        'Director',
      );
      if (!responseFromPerson.length) {
        return { result: null, amount: 0 };
      }
      movies.andWhere(`id in (:...ids)`, { ids: responseFromPerson });
    }

    if (dto.actor) {
      const responseFromPerson = await this.getMoviesByPersonsMS(dto, 'Actor');
      if (!responseFromPerson.length) {
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
        ratingCount: dto.ratingCount * 1000,
      });
    }

    if (dto.partName) {
      movies.andWhere('"nameRu" like :nameRu', {
        nameRu: '%' + dto.partName + '%',
      });
    }

    if (dto.years) {
      const years = dto.years.split('-');

      // проверяем условие 1980 (если пришёл 1980 год, то ищем всё до 1980 года включительно)

      if (dto.years == '1980') {
        movies.andWhere('year <= :start', { start: years[0] });
      } else {
        if (years.length == 1) years[1] = years[0];

        movies.andWhere('year >= :start and year <= :end', {
          start: years[0],
          end: years[1],
        });
      }

      if (years[1]) {
        movies.andWhere('year <= :end', { end: years[1] });
      }
    }

    if (dto.countries) {
      const countries = dto.countries.split(' ');
      await movies
        .leftJoin('movies.countries', 'c')
        .andWhere('c.shortName in (:...countries)', { countries: countries })
        .getMany();
    }

    //если не пришло направление сортировки - устанавливаем по id
    const sort = dto.sort || 'rating';

    //определяем направление сортировки
    const order =
      ['rating', 'ratingCount', 'year'].findIndex((o) => o == sort) + 1
        ? 'DESC'
        : 'ASC';

    //сортируем
    movies.orderBy('movies.' + sort, order);

    //если не пришла пагинация - выдаём первую страницу, 35 записей
    const pagination = [1, 35];
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
    } else if (amountOfMovies - (pagination[0] - 1) * pagination[1] < 0) {
      pagination[1] = amountOfMovies - pagination[0] * pagination[1];
    }

    const rawResult: Movie[] = rawListOfMovies.slice(
      (pagination[0] - 1) * pagination[1],
      (pagination[0] - 1) * pagination[1] + pagination[1],
    );

    //преобразуем полный список в минимувис для выдачи, пока без жанров и персон
    const result: MiniMovieDto[] | null = [];

    rawResult.forEach((movie) => {
      //это работает благодаря наличию конструктора класса
      const tempMovie = new MiniMovieDto(null);
      for (const tempMovieKey in tempMovie) {
        tempMovie[tempMovieKey] = movie[tempMovieKey];
      }
      result.push(tempMovie);
    });

    // извлекаем ids результата для использования ниже в запросах к микросервисам
    const resultIds = result.map((movie) => movie.id);

    // запрашиваем жанры для обогащения нашей поисковой выдачи
    const genresMap: Map<number, GenresDto[]> = new Map(
      await this.getGenresByMoviesIds(resultIds),
    );
    // обогащаем результат жанрами и странами
    // todo переделать страны на получение массива от сервиса
    for (const movie of result) {
      movie.genres = genresMap.get(movie.id);
      const countries: [number, CountryDto[]][] =
        await this.countriesService.getCountriesByMovie({
          movieId: [movie.id],
        });
      movie.countries = countries[0][1];
    }
    /*
    const countries = await this.countriesService.getCountriesByMovie({
      movieId: [resultIds],
    });*/

    return { result: result, amount: amountOfMovies };
  }

  async createGenresPersonsForMovie(
    movie,
    dto,
  ): Promise<{ [key: string]: any }[] | null> {
    const errors = [];

    await lastValueFrom(
      this.genresClient.send(
        { cmd: 'addGenresToMovie' },
        {
          movieId: movie.id,
          genres: dto.genres || [],
        },
      ),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.send(
        { cmd: 'addPersonsToMovie' },
        {
          movieId: movie.id,
          director: dto.director,
          actors: dto.actors,
          producer: dto.producer,
          editor: dto.editor,
          operator: dto.operator,
          composer: dto.composer,
        },
      ),
    ).catch((e) => errors.push({ persons: e }));

    return errors.length > 0 ? errors : null;
  }
  async createMovie(
    dto: FullMovieDto,
  ): Promise<{ movie: Movie | null; errors: { [key: string]: any }[] | null }> {
    console.log('Movies MS - Service - createMovie at', new Date());

    if (!dto.nameRu || !dto.year || !dto.duration)
      return {
        movie: null,
        errors: [
          {
            movies:
              'Error: nameRu, year, duration must to contain correct values',
          },
        ],
      };

    const movie: Movie = await this.moviesRepository.save(dto);

    const errors: { [key: string]: any }[] = [];

    const createGenresPersonsResult: { [key: string]: any }[] | null =
      await this.createGenresPersonsForMovie(movie, dto);

    if (createGenresPersonsResult != null)
      errors.push(...createGenresPersonsResult);

    await this.countriesService.addCountriesToMovie({
      movieId: movie.id,
      countries: dto.countries || [],
    });

    return { movie: movie, errors: errors };
  }

  async getMovieById(
    id: number,
  ): Promise<{ movie: FullMovieDto | null; errors: { [key: string]: any }[] }> {
    console.log('Movies MS - Service - getMovieById at', new Date());
    const errors: { [key: string]: any }[] = [];

    /*    const movie = await this.moviesRepository
      .findOne({ where: { id: id } })
      .catch((e) => {
        return e;
      });*/

    const movie: Movie | null = await this.moviesRepository
      .createQueryBuilder()
      .where(`id=:id`, { id: id })
      .getOne();

    if (movie === null)
      return { movie: null, errors: [{ movie: 'Movie not found' }] };

    const genres: GenresDto[] = await lastValueFrom(
      this.genresClient.send(
        { cmd: 'getGenresByMoviesIds' },
        { movies: [movie.id] },
      ),
    ).catch((e) => errors.push({ genres: e }));

    const persons: { [key: string]: PersonsDto[] } = await lastValueFrom(
      this.personsClient.send({ cmd: 'getMoviePersons' }, movie.id),
    ).catch((e) => {
      errors.push({ persons: e });
    });

    //todo посмотреть на свежую голову, как оптимизировать этот участок
    const countries: [number, CountryDto[]][] =
      await this.countriesService.getCountriesByMovie({
        movieId: [id],
      });

    let fullMovie: FullMovieDto = Object.create(FullMovieDto);
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
    //todo при пустых странах/жанрах - ошибка. но их не должно быть пустых. добавить проверку
    fullMovie = Object.assign(
      fullMovie,
      new FullMoviePersonsDto(persons),
      { genres: genres[0][1] },
      { countries: countries[1] },
    );

    return { movie: fullMovie, errors: errors };
  }

  async deleteMovieFromMS(
    id: number,
  ): Promise<{ [key: string]: any }[] | null> {
    const errors: { [key: string]: any }[] = [];
    await lastValueFrom(
      this.genresClient.send({ cmd: 'deleteMovieFromGenres' }, { movieId: id }),
    ).catch((e) => errors.push({ genres: e }));

    await lastValueFrom(
      this.personsClient.send(
        { cmd: 'deleteMovieFromPersons' },
        { movieId: id },
      ),
    ).catch((e) => errors.push({ persons: e }));

    await lastValueFrom(
      this.commentsClient.send(
        { cmd: 'deleteCommentsFromEssence' },
        {
          dto: { essenceTable: 'movies', essenceId: id },
        },
      ),
    ).catch((e) => errors.push({ comments: e }));
    /*  await lastValueFrom(
   this.filesClient.send(
     { cmd: 'deleteFiles' },
     {
       dto: { essenceTable: 'movies', essenceId: id },
     },
   ),
 ).catch((e) => errors.push({ files: e }));*/ //todo включить когда будут файлы

    return errors.length > 0 ? errors : null;
  }

  async deleteMovie(id: number): Promise<{
    result: DeleteResult | null;
    errors: { [key: string]: string }[];
  }> {
    console.log('Movies MS - Service - deleteMovie at', new Date());
    const errors: { [key: string]: string }[] = [];
    const result: DeleteResult = <DeleteResult>await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: id })
      .execute()
      .catch((e) =>
        errors.push({
          movies: e,
        }),
      );

    if (result.affected == 0) errors.push({ movies: 'Error file deleting' });

    if (errors.length) return { result: null, errors: errors };

    const deleteFromMsResult: { [key: string]: any }[] | null =
      await this.deleteMovieFromMS(id);
    if (deleteFromMsResult != null) errors.push(...deleteFromMsResult);

    return { result: result, errors: errors };
  }

  async updateGenresOfMovie(
    movieId,
    updateMovieDto,
  ): Promise<{ [key: string]: any }[] | null> {
    const errors: { [key: string]: any }[] = [];
    await lastValueFrom(
      this.genresClient.send(
        { cmd: 'addGenresToMovie' },
        { movieId: movieId, genres: updateMovieDto.genres || [] },
      ),
    ).catch((e) => errors.push({ genres: e }));
    return errors.length > 0 ? errors : null;
  }

  async updatePersonsOfMovie(movieId, updateMovieDto) {
    const errors = [];

    await lastValueFrom(
      this.personsClient.send(
        { cmd: 'addPersonsToMovie' },
        {
          movieId: movieId,
          director: updateMovieDto.director,
          actors: updateMovieDto.actors,
          producer: updateMovieDto.producer,
          editor: updateMovieDto.editor,
          operator: updateMovieDto.operator,
          composer: updateMovieDto.composer,
        },
      ),
    ).catch((e) => errors.push({ persons: e }));
    return errors.length > 0 ? errors : null;
  }
  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    console.log('Movies MS - Service - editMovie at', new Date());

    if (!(await this.moviesRepository.findOne({ where: { id: movieId } })))
      return 'Movie with this number not found';

    const errors = [];

    //подготовка информации для записи в базу фильмов
    const toMovieBaseUpdate = {
      ...updateMovieDto,
      id: movieId,
    };
    delete toMovieBaseUpdate.countries;
    delete toMovieBaseUpdate.genres;
    delete toMovieBaseUpdate.actors;
    delete toMovieBaseUpdate.producer;
    delete toMovieBaseUpdate.director;
    delete toMovieBaseUpdate.editor;
    delete toMovieBaseUpdate.operator;
    delete toMovieBaseUpdate.composer;

    //запись информации в базу фильмов
    const edit = await this.moviesRepository
      .createQueryBuilder()
      .update()
      .set(toMovieBaseUpdate);

    const updateGenresOfMovieResult = await this.updateGenresOfMovie(
      movieId,
      updateMovieDto,
    );
    if (updateGenresOfMovieResult != null)
      errors.push(...updateGenresOfMovieResult);

    const updatePersonsOfMovieResult = await this.updatePersonsOfMovie(
      movieId,
      updateMovieDto,
    );
    if (updatePersonsOfMovieResult != null)
      errors.push(...updatePersonsOfMovieResult);

    //todo скорее всего здесь надо сделать другой метод.. надо проверить
    await this.countriesService.addCountriesToMovie({
      movieId: movieId,
      countries: updateMovieDto.countries || [],
    });

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
