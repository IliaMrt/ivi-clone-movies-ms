import { GenresDto } from "./genres.dto";

export class MiniMovieDto {
  id: number;
  nameRu: string;
  nameEn: string;
  poster: string;
  rating: number;
  year: number;
  country: [];
  genres: GenresDto;
  duration: number;
}
