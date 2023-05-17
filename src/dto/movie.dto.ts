import { MiniMovieDto } from "./mini-movie.dto";
import { PersonsDto } from "./persons.dto";
import { CountryDto } from "./country.dto";
import { GenresDto } from "./genres.dto";

export class ShortMovieDto {


  id: number;
  nameRu: string;
  nameEn: string;
  type: string;
  description: string;
  country: CountryDto[];
  trailer: string;
  similarMovies: number[];
  year: number;
  rating: number;
  ratingCount: number;
  ageRating: number;
  poster: string;
  duration: number;
  slogan: string;
}
