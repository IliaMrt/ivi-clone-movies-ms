import { PersonsDto } from './persons.dto';

export class FullMovieDto {
  id: number;
  nameru: string;
  nameen: string;
  type: string;
  description: string;
  country: [];
  genres: [];
  trailer: string;
  similarmovies: any; //number[] | MiniMovieDto[];
  year: number;
  rating: number;
  ratingcount: number;
  agerating: number;
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
