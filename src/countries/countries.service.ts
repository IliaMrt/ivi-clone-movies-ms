import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country } from './entity/country.entity';
import { Movie } from '../movies.entity';
import { CountryDto } from './dto/country.dto';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { AddCountryToMovieDto } from './dto/add-country-to-movie.dto';
import { MoviesByCountriesDto } from './dto/movies-by-countries.dto';
import { DeleteCountryDto } from './dto/delete-country.dto';
import { CountryByMovieDto } from './dto/country-by-movie.dto';
import { CountriesList } from '../constants/countries.list';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country) private countryRepository: Repository<Country>,
    @InjectRepository(Movie) private movieRepository: Repository<Movie>,
  ) {}

  async createCountry(/*createCountryMessageDto: CountryDto*/) /*: Promise<Country>*/ {
    console.log('Countries MS - Service - createCountry at', new Date());
    for (const country of CountriesList) {
      await this.countryRepository.save(country);
    }
    // console.log(`${counter} countries created`);
    return;
    // return this.countryRepository.save(createCountryMessageDto);
  }

  async getAllCountries(): Promise<Country[]> {
    console.log('Countries MS - Service - getAllCountries at', new Date());
    return this.countryRepository.find();
  }

  /* async getCountryById(getCountryByIdDto: CountryByIdDto): Promise<Country[]> {
    console.log('Countries MS - Service - getCountry at', new Date());
    return await this.countryRepository.find({
      where: { id: getCountryByIdDto.movieId },
    });
  }*/

  async deleteCountry(country: DeleteCountryDto): Promise<DeleteResult> {
    console.log('Countries MS - Service - deleteCountry at', new Date());
    return this.countryRepository.delete(country.shortName);
  }

  async updateCountry(updateCountryMessageDto: {
    movieId: number;
    updateCountryDto: CountryDto;
  }): Promise<UpdateResult> {
    console.log('Countries MS - Service - updateCountry at', new Date());
    return this.countryRepository.update(
      updateCountryMessageDto.updateCountryDto.shortName,
      {
        nameRu: updateCountryMessageDto.updateCountryDto.nameRu,
        nameEn: updateCountryMessageDto.updateCountryDto.nameEn,
      },
    );
  }

  async addCountriesToMovie(addCountriesToMovieDto: AddCountryToMovieDto) {
    console.log('Countries MS - Service - addCountriesToMovie at', new Date());
    // this.createCountry();
    //Create movie if not exists
    if (
      !(await this.movieRepository.findOneBy({
        id: addCountriesToMovieDto.movieId,
      }))
    ) {
      // console.log(addCountriesToMovieDto);
      await this.movieRepository.save({
        id: addCountriesToMovieDto.movieId,
      });
    } else {
      //todo
      // console.log('Film is already exist');
    }

    //Get movie
    const movie = await this.movieRepository.findOneBy({
      id: addCountriesToMovieDto.movieId,
    });
    // console.log(`movie: ${JSON.stringify(movie)}`);

    //Adding countries to movie
    movie.countries = [];
    for (const countryShortName of addCountriesToMovieDto.countries) {
      const country = await this.countryRepository.findOneBy({
        shortName: countryShortName,
      });
      movie.countries.push(country);
    }
    // console.log(`movie with countries: ${JSON.stringify(movie)}`);

    return await this.movieRepository.save(movie);
  }

  async getMoviesByCountries(
    getMoviesByCountriesDto: MoviesByCountriesDto,
  ): Promise<number[]> {
    console.log(
      'Countries MS - Service - getMoviesByCountriesDto at',
      new Date(),
    );
    const result: number[] = [];
    for (const countryShortName of getMoviesByCountriesDto.countries) {
      const moviesByCountry = await this.movieRepository.find({
        relations: {
          countries: true,
        },
        where: {
          countries: {
            shortName: countryShortName,
          },
        },
      });
      const moviesByCountryIds = moviesByCountry.map((movie) => movie.id);

      result.push(...moviesByCountryIds);
    }
    return result;
  }

  async getCountriesByMovie(
    getCountryByMovieDto: CountryByMovieDto,
  ): Promise<any> {
    console.log(
      'Countries MS - Service - getCountriesByMoviesDto at',
      new Date(),
    );
    // return await this.countryRepository.findBy({
    //   movie: undefined, nameEn: undefined, nameRu: undefined, shortName: undefined,
    /*   relations: {
        movie: true,
      },*/
    // where: { movie: { id: ArrayOverlap(getCountryByMovieDto.movieId) } },
    // id: Raw(``, {id: getCountryByMovieDto.movieId})
    // });
    // console.log(`ids: ${getCountryByMovieDto.movieId}`);
    /* return await this.countryRepository
      .createQueryBuilder('country')
      .innerJoin('movie_country', 'movie', '"movie_id" IN (:...ids)', {
        ids: getCountryByMovieDto.movieId,
      })
      .getMany();*/
    const result = [];
    for (const id of getCountryByMovieDto.movieId) {
      const fullArray = await this.countryRepository.find({
        select: {},
        // relations: { movie: false },
        where: {
          movie: {
            id: id,
          },
        },
      });
      /*const countries=fullArray.map((fullMovie) => {
        console.log(`FullMovie: ${JSON.stringify(fullMovie)}`);
        new Object({
          nameEn: fullMovie.nameEn,
          nameRu: fullMovie.nameRu,
          shortName: fullMovie.shortName,
        });
      });
     */
      result.push(id, fullArray);
    }

    /*console.log(
      '111 ' +
        JSON.stringify(
          await this.countryRepository.find({
            relations: { movie: true },
            where: {
              movie: {
                id: 10,
              },
            },
          }),
        ),
    );*/

    /*const b = await this.movieRepository.find({
      relations: { countries: true },
      where: {
        countries: {
          shortName: 'uz',
        },
      },
    });*/
    // console.log('-----------');
    // console.log(`result: ${JSON.stringify(result)}`);
    // console.log(a.map((l) => l.shortName));
    // console.log(b.map((l) => l.id));
    return result;
  }

  async deleteMovieFromCountries(movieId: number) {
    return this.movieRepository.delete({ id: movieId });
  }
}
