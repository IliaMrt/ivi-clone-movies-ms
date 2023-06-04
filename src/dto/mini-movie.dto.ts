import { GenresDto } from './genres.dto';
import { CountryDto } from '../countries/dto/country.dto';

export class MiniMovieDto {
  constructor(dto) {
    if (dto == null) {
      this.id = undefined;
      this.nameRu = undefined;
      this.nameEn = undefined;
      this.poster = undefined;
      this.rating = undefined;
      this.ratingCount = undefined;
      this.year = undefined;
      this.countries = undefined;
      this.genres = undefined;
      this.duration = undefined;
    } else {
      for (const key in dto) this[key] = dto[key];
    }
  }
  id: number;
  nameRu: string;
  nameEn: string;
  poster: string;
  rating: number;
  ratingCount: number;
  year: number;
  countries: CountryDto[];
  genres: GenresDto[];
  duration: number;
}
