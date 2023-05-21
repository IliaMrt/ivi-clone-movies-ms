import { GenresDto } from './genres.dto';
import { Country } from "../countries/entity/country.entity";
import { CountryDto } from "../countries/dto/country.dto";

export class MiniMovieDto {
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
