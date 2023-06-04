import { PersonsDto } from './persons.dto';
import { MiniMovieDto } from './mini-movie.dto';

export class FullMovieDto {
  constructor() {
    this.nameRu='первый фильм'
    this.year=1981
    this.duration=100
  }
  id: number;
  nameRu: string;
  nameEn: string;
  description: string;
  countries: any[];
  genres: any[];
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
  actors: PersonsDto[] | number[];
  producer: PersonsDto[];
  editor: PersonsDto[];
  operator: PersonsDto[];
  composer: PersonsDto[];
}
