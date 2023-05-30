import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './movies.entity';
import { Country } from './countries/entity/country.entity';
import { MoviesController } from './movies.controller';
import { CountriesService } from './countries/countries.service';
import { UpdateMovieDto } from './dto/update.movie.dto';
import { Repository } from 'typeorm';

describe('MoviesService', () => {
  let service: MoviesService;
  let moviesRepository: Repository<Movie>;
  const token = getRepositoryToken(Movie);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: token,
          useClass: Repository,
        },
        CountriesService,

        {
          provide: 'GENRES',
          useValue: {},
        },
        {
          provide: 'AUTH',
          useValue: {},
        },
        {
          provide: 'FILES',
          useValue: {},
        },
        {
          provide: 'COMMENTS',
          useValue: {},
        },
        {
          provide: 'PERSONS',
          useValue: {},
        },
        {
          provide: 'CountryRepository',
          useValue: TypeOrmModule.forFeature([Movie, Country]),
        },
      ],
    }).compile();
    service = module.get<MoviesService>(MoviesService);
    moviesRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
  });

  it('should be defined', async () => {
    expect(moviesRepository).toBeDefined();
    expect(await service.getMovieById(1)).toBeDefined();
  });
});
