import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { Country } from './countries/entity/country.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column({ type: 'varchar', length: 255 })
  'nameRu': string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  nameEn: string;
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  trailer: string;

  @Column({ nullable: true, type: 'simple-array' })
  similarMovies: number[] | MiniMovieDto[];

  @Column({ type: 'numeric' })
  year: number;

  @Column({ nullable: true, type: 'numeric', default: 0 })
  rating: number;

  @Column({ nullable: true, type: 'numeric', default: 0 })
  ratingCount: number;

  @Column({ nullable: true, type: 'numeric', default: 18 })
  ageRating: number;

  @Column({ nullable: true, type: 'text' })
  poster: string;

  @Column({ type: 'numeric' })
  duration: number;

  @Column({ nullable: true, type: 'text' })
  slogan: string;

  @ManyToMany(() => Country, (country) => country.shortName)
  @JoinTable({
    name: 'movie_country',
    joinColumn: { name: 'movie_id' },
    inverseJoinColumn: { name: 'country_shortName' },
  })
  countries: Country[];
}
