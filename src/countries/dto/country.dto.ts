import { Movie } from '../../movies.entity';

export class CountryDto {
  // id: number;
  nameRu: string;
  shortName: string;
  nameEn: string;
  movie: Movie[];
}
