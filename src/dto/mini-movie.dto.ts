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
    this.country = undefined;
    this.genres = undefined;
    this.duration = undefined;
  }
  id: number;
  nameRu: string;
  nameEn: string;
  poster: string;
  rating: number;
  year: number;
  country: CountryDto[];
  genres: GenresDto[];
  duration: number;
}
