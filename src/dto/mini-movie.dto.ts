import { GenresDto } from './genres.dto';
import { CountryDto } from '../countries/dto/country.dto';

export class MiniMovieDto {
  constructor() {
    this.id = undefined;
    this.nameRu = undefined;
    this.nameEn = undefined;
    this.poster = undefined;
    this.rating = undefined;
    this.year = undefined;
    this.countries = undefined;
    this.genres = undefined;
    this.duration = undefined;
  }
  id: number;
  nameRu: string;
  nameEn: string;
  poster: string;
  rating: number;
  year: number;
  countries: CountryDto[];
  genres: GenresDto[];
  duration: number;
}
