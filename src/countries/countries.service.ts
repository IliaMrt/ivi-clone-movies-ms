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

  async createCountry() {
    console.log('Countries MS - Service - createCountry at', new Date());
    for (const country of CountriesList) {
      await this.countryRepository.save(country);
    }
    return;
  }

  async getCountriesRepository() {
    return this.countryRepository;
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
    //Create movie if not exists
    /*   if (
      !(await this.movieRepository.findOneBy({
        id: addCountriesToMovieDto.movieId,
      }))
    ) {
      await this.movieRepository.save({
        id: addCountriesToMovieDto.movieId,
      });
    } */

    //Get movie
    const movie = await this.movieRepository.findOneBy({
      id: addCountriesToMovieDto.movieId,
    });

    //Adding countries to movie
    movie.countries = [];
    for (const countryShortName of addCountriesToMovieDto.countries) {
      const country = await this.countryRepository.findOneBy({
        shortName: countryShortName,
      });
      movie.countries.push(country); // todo переделать из цикла в массив
    }

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
  ): Promise<[number, CountryDto[]][]> {
    console.log(
      'Countries MS - Service - getCountriesByMoviesDto at',
      new Date(),
    );

    const result: [number, CountryDto[]][] = [];
    for (const id of getCountryByMovieDto.movieId) {
      const fullArray = await this.countryRepository.find({
        select: {},
        where: {
          movie: {
            id: id,
          },
        },
      });

      result.push([id, fullArray]);
    }

    return result;
  }

  async deleteMovieFromCountries(movieId: number) {
    return this.movieRepository.delete({ id: movieId });
  }
}
