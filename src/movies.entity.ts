import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { MiniMovieDto } from './dto/mini-movie.dto';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('increment')
  id: number;
  //TODO nullable удалить из продакшена
  @Column({ nullable: true, type: 'varchar', length: 255 })
  'nameRu': string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  nameEn: string;
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  country: string[]; // CountryDto[];
  // genres: genre[],
  @Column({ nullable: true, type: 'text' })
  trailer: string;

  @Column({ nullable: true, type: 'simple-array' })
  similarMovies: number[] | MiniMovieDto[];

  @Column({ type: 'numeric' })
  year: number;

  @Column({ nullable: true, type: 'numeric' })
  rating: number;

  @Column({ nullable: true, type: 'numeric' })
  ratingCount: number;

  @Column({ nullable: true, type: 'numeric' })
  ageRating: number;

  @Column({ nullable: true, type: 'text' })
  poster: string;
  //TODO nullable удалить из продакшена
  @Column({ nullable: true, type: 'numeric' })
  duration: number;

  @Column({ nullable: true, type: 'text' })
  slogan: string;
}
