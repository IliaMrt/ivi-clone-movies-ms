import { Movie } from '../../movies.entity';

export class CountryDto {
  nameRu: string;
  shortName: string;
  nameEn: string;
  movie: Movie[];
}
