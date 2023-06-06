import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMTestingModule } from './test-utils/TypeORMTestingModule';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Movie } from './movies.entity';
import { FullMovieDto } from './dto/full.movie.dto';
import { CountriesModule } from './countries/countries.module';
import { Country } from './countries/entity/country.entity';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { INestApplication } from '@nestjs/common';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { CountriesService } from './countries/countries.service';
import { UpdateMovieDto } from './dto/update.movie.dto';

describe('movies Controller', () => {
  let controller: MoviesController;
  let moviesService: MoviesService;
  let countryService: CountriesService;
  let repository: Repository<Movie>;
  let app: INestApplication;
  let client: ClientProxy;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `.${process.env.NODE_ENV}.env`,
        }),

        TypeORMTestingModule([Movie, Country]),
        TypeOrmModule.forFeature([Movie, Country]),
        CountriesModule,

        ClientsModule.registerAsync([
          {
            name: 'GENRES',
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'toGenresMs',
                queueOptions: {
                  durable: false,
                },
              },
            }),
            /*       inject: [MoviesService],
            imports: [MoviesModule],*/
          },
          {
            name: 'PERSONS',
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'toPersonsMs',
                queueOptions: {
                  durable: false,
                },
              },
            }),
            /*       inject: [MoviesService],
            imports: [MoviesModule],*/
          },
          {
            name: 'FILES',
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'toFilesMs',
                queueOptions: {
                  durable: false,
                },
              },
            }),
            /*     inject: [MoviesService],
            imports: [MoviesModule],*/
          },
          {
            name: 'COMMENTS',
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'toCommentsMs',
                queueOptions: {
                  durable: false,
                },
              },
            }),
            /*         inject: [MoviesService],
            imports: [MoviesModule],*/
          },
          {
            name: 'AUTH',
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'toAuthMs',
                queueOptions: {
                  durable: false,
                },
              },
            }),
            /*     inject: [MoviesService],
            imports: [MoviesModule],*/
          },
        ]),
      ],
      providers: [MoviesService],
      controllers: [MoviesController],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    moviesService = module.get<MoviesService>(MoviesService);
    countryService = module.get<CountriesService>(CountriesService);
    repository = await moviesService.getMoviesRepository();

    app = module.createNestApplication();

    app.connectMicroservice({
      transport: Transport.TCP,
    });

    await app.startAllMicroservices();
    await app.init();

    client = app.get('GENRES');
    await client.connect();
  }, 20000);
  beforeEach(async () => {
    const connection = repository.manager.connection;
    await connection.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    client.close();
  });

  describe('get all countries', () => {
    it('should get null countries', async () => {
      const res = await moviesService.getAllCountries();
      expect(res).toStrictEqual([]);
    });

    it('should fill and get all countries', async () => {
      await moviesService.fillCountries();
      const res = await moviesService.getAllCountries();
      expect(res).toBeDefined();
    });
  });

  describe('should delete movie', () => {
    it('should delete existed movie', async () => {
      const correctResult = { errors: [], result: new DeleteResult() };
      correctResult.result.affected = 1;
      correctResult.result.raw = [];

      jest
        .spyOn(moviesService, 'deleteMovieFromMS')
        .mockImplementation(async (id: number) => {
          return null;
        });
      await repository.save({
        year: 1,
        duration: 1,
        nameRu: '1',
        ...new FullMovieDto(),
      });
      const res = await moviesService.deleteMovie(1);
      expect(res).toStrictEqual(correctResult);
    });

    it('should delete not existed movie', async () => {
      const correctResult = {
        errors: [{ movies: 'Error file deleting' }],
        result: null,
      };

      jest
        .spyOn(moviesService, 'deleteMovieFromMS')
        .mockImplementation(async (id: number) => {
          return null;
        });

      const res = await moviesService.deleteMovie(1);
      expect(res).toStrictEqual(correctResult);
    });
  });

  describe('get movies', () => {
    beforeEach(async () => {
      await repository.save({ ...new FullMovieDto(), nameRu: 'Фильм1' });
      await repository.save({
        ...new FullMovieDto(),
        nameRu: 'Фильм2',
        year: 2000,
      });
      await repository.save({
        ...new FullMovieDto(),
        nameRu: 'Фильм3',
        year: 1979,
      });
      await repository.save({
        ...new FullMovieDto(),
        nameRu: 'Фильм4',
        rating: 5,
      });
      await repository.save({
        ...new FullMovieDto(),
        nameRu: 'Фильм5',
        ratingCount: 1000,
      });
      await repository.save({
        ...new FullMovieDto(),
        nameRu: 'Фильм6',
        year: 2001,
      });
    });

    it('should get no movie (not exited)', async () => {
      const connection = repository.manager.connection;
      await connection.synchronize(true);
      const correctResult = {
        amount: 0,
        result: null,
      };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto(null),
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get all movies (without filter)', async () => {
      await repository.save({
        year: 1,
        duration: 1,
        nameRu: '1',
        ...new FullMovieDto(),
      });

      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, [null]]];
        });

      const correctResult = {
        amount: 7,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 4,
            nameEn: null,
            nameRu: 'Фильм4',
            poster: null,
            genres: undefined,
            rating: '5',
            ratingCount: '0',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 2,
            nameEn: null,
            nameRu: 'Фильм2',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2000',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 3,
            nameEn: null,
            nameRu: 'Фильм3',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '1979',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 1,
            nameEn: null,
            nameRu: 'Фильм1',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 5,
            nameEn: null,
            nameRu: 'Фильм5',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '1000',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 6,
            nameEn: null,
            nameRu: 'Фильм6',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2001',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 7,
            nameEn: null,
            nameRu: 'первый фильм',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '1981',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto(null),
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter YEAR 2000)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[2, [{ nameRu: 'комедия', nameEn: 'comedy' }]]];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            genres: [
              {
                nameEn: 'comedy',
                nameRu: 'комедия',
              },
            ],
            id: 2,
            nameEn: null,
            nameRu: 'Фильм2',
            poster: null,
            rating: '0',
            ratingCount: '0',
            year: '2000',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto('2000'),
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter YEAR 1980)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[3, [{ nameRu: 'комедия', nameEn: 'comedy' }]]];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            genres: [
              {
                nameEn: 'comedy',
                nameRu: 'комедия',
              },
            ],
            id: 3,
            nameEn: null,
            nameRu: 'Фильм3',
            poster: null,
            rating: '0',
            ratingCount: '0',
            year: '1979',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto('1980'),
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter YEARS 2000-2001)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });

      const correctResult = {
        amount: 2,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 2,
            nameEn: null,
            nameRu: 'Фильм2',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2000',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 6,
            nameEn: null,
            nameRu: 'Фильм6',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2001',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto('2000-2001'),
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter DIRECTOR)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });
      jest
        .spyOn(moviesService, 'getMoviesByPersonsMS')
        .mockImplementation(async () => {
          return [6];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 6,
            nameEn: null,
            nameRu: 'Фильм6',
            genres: undefined,
            poster: null,
            rating: '0',
            ratingCount: '0',
            year: '2001',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), director: 'sss' },
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter ACTORS)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });

      const correctResult = {
        amount: 6,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 1,
            nameEn: null,
            nameRu: 'Фильм1',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 2,
            nameEn: null,
            nameRu: 'Фильм2',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2000',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 3,
            nameEn: null,
            nameRu: 'Фильм3',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '1979',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 4,
            nameEn: null,
            nameRu: 'Фильм4',
            poster: null,
            genres: undefined,
            rating: '5',
            ratingCount: '0',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 5,
            nameEn: null,
            nameRu: 'Фильм5',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '1000',
            year: '1981',
          }),
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 6,
            nameEn: null,
            nameRu: 'Фильм6',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '0',
            year: '2001',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), sort: 'nameRu' },
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter RATING)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 4,
            nameEn: null,
            nameRu: 'Фильм4',
            poster: null,
            genres: undefined,
            rating: '5',
            ratingCount: '0',
            year: '1981',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), rating: 1 },
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get one movie (filter RATING COUNT)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 5,
            nameEn: null,
            nameRu: 'Фильм5',
            poster: null,
            genres: undefined,
            rating: '0',
            ratingCount: '1000',
            year: '1981',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), ratingCount: 1 },
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get all movies (sort by name)', async () => {
      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });
      jest
        .spyOn(moviesService, 'getMoviesByPersonsMS')
        .mockImplementation(async () => {
          return [6];
        });

      const correctResult = {
        amount: 1,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 6,
            nameEn: null,
            nameRu: 'Фильм6',
            genres: undefined,
            poster: null,
            rating: '0',
            ratingCount: '0',
            year: '2001',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), actor: 'sss' },
        }),
      ).toStrictEqual(correctResult);
    });
    it('should get one movie on PAGE 2', async () => {
      for (let i = 7; i <= 36; i++)
        await repository.save({ ...new FullMovieDto(), nameRu: `Фильм${i}` });

      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [[null, []]];
        });

      const correctResult = {
        amount: 36,
        result: [
          new MiniMovieDto({
            countries: [],
            duration: '100',
            id: 36,
            nameEn: null,
            nameRu: 'Фильм36',
            poster: null,
            rating: '0',
            genres: undefined,
            ratingCount: '0',
            year: '1981',
          }),
        ],
      };
      expect(
        await controller.getMovies({
          movieFilterDto: { ...new MovieFilterDto(null), page: 2 },
        }),
      ).toStrictEqual(correctResult);
    });

    it('should get no movie (no matches with filter)', async () => {
      await repository.save(new FullMovieDto());
      await repository.save({ ...new FullMovieDto() });

      jest
        .spyOn(moviesService, 'getGenresByMoviesIds')
        .mockImplementation(async () => {
          return [
            [1, [{ nameRu: 'ужасы', nameEn: 'horror' }]],
            [2, [{ nameRu: 'комедия', nameEn: 'comedy' }]],
          ];
        });

      const correctResult = { amount: 0, result: null };
      expect(
        await controller.getMovies({
          movieFilterDto: new MovieFilterDto('1901'),
        }),
      ).toStrictEqual(correctResult);
    });
  });

  describe('create movie', () => {
    it('should create movie', async () => {
      const createMovieDto = new FullMovieDto();

      const expectedResult = {
        errors: [],
        movie: createMovieDto,
      };
      jest
        .spyOn(moviesService, 'createGenresPersonsForMovie')
        .mockImplementation(() => null);

      jest
        .spyOn(countryService, 'addCountriesToMovie')
        .mockImplementation(async () => new Movie());
      expect(
        await controller.createMovie({ createMovieDto: createMovieDto }),
      ).toStrictEqual(expectedResult);
    });

    it('should get error (incorrect value)', async () => {
      const createMovieDto = new FullMovieDto();
      createMovieDto.year = null;
      const expectedResult = {
        errors: [
          {
            movies:
              'Error: nameRu, year, duration must to contain correct values',
          },
        ],
        movie: null,
      };
      jest
        .spyOn(moviesService, 'createGenresPersonsForMovie')
        .mockImplementation(() => null);

      jest
        .spyOn(countryService, 'addCountriesToMovie')
        .mockImplementation(async () => new Movie());
      expect(
        await controller.createMovie({ createMovieDto: createMovieDto }),
      ).toStrictEqual(expectedResult);
    });
  });

  describe('update movie', () => {
    it('update not existed movie', async () => {
      const expectedResult = 'Movie with this number not found';
      expect(
        await controller.updateMovie({
          movieId: 111,
          updateMovieDto: {
            ...new UpdateMovieDto(),
          },
        }),
      ).toStrictEqual(expectedResult);
    });

    it('update existed movie', async () => {
      jest
        .spyOn(moviesService, 'updateGenresOfMovie')
        .mockImplementation(async () => null);
      jest
        .spyOn(moviesService, 'updatePersonsOfMovie')
        .mockImplementation(async () => null);
      jest
        .spyOn(countryService, 'addCountriesToMovie')
        .mockImplementation(async () => new Movie());

      await repository.save(new FullMovieDto());

      const result = new UpdateResult();
      result.affected = 1;
      result.generatedMaps = [];
      result.raw = [];
      const expectedResult = {
        errors: [],
        result: result,
      };

      expect(
        await controller.updateMovie({
          movieId: 1,
          updateMovieDto: {
            ...new UpdateMovieDto(),
            nameRu: 'aaa',
            duration: 2,
            year: 3000,
            countries: [],
          },
        }),
      ).toStrictEqual(expectedResult);
    });
  });
});
