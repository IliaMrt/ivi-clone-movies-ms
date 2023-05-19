import { PersonsDto } from './persons.dto';
import { MiniMovieDto } from "./mini-movie.dto";

export class UpdateMovieDto {

  nameRu: string;
  nameEn: string;
  type: string;
  description: string;
  country: [];
  genres: [];
  trailer: string;
  similarMovies: number[] | MiniMovieDto[];
  year: number;
  rating: number;
  ratingCount: number;
  ageRating: number;
  poster: string;
  duration: number;
  slogan: string;
  director: PersonsDto[];
  actors: PersonsDto[];
  producer: PersonsDto[];
  cinematographer: PersonsDto[];
  screenwriter: PersonsDto[];
  composer: PersonsDto[];
}
