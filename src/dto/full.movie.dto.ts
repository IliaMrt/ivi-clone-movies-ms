import { PersonsDto } from './persons.dto';
import { MiniMovieDto } from './mini-movie.dto';

export class FullMovieDto {
  id: number;
  nameRu: string;
  nameEn: string;
  description: string;
  countries: [];
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
  producer: number[];
  editor: PersonsDto[];
  operator: PersonsDto[];
  composer: PersonsDto[];
}
