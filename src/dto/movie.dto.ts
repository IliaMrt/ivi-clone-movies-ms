import { CountryDto } from '../countries/dto/country.dto';

export class MovieDto {
  id: number;
  nameRu: string;
  nameEn: string;
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
