import {
  Entity,
  Column,
  PrimaryColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
// import { MiniMovieDto } from './dto/mini-movie.dto';
import { Movie } from '../../movies.entity';

@Entity('country')
export class Country {
/*  @PrimaryGeneratedColumn('increment')
  id: number;*/

  @Column({ type: 'varchar', length: 255 })
  'nameRu': string;

  @Column({ type: 'varchar', length: 255 })
  'nameEn': string;
  @PrimaryColumn({ type: 'varchar', length: 255 })
  'shortName': string;

  /* @ManyToMany(() => Movie, (movie) => movie.id, { onDelete: 'CASCADE' })
  @JoinTable()
  movies: Movie[];*/
  @ManyToMany(() => Movie, (movie) => movie.id)
  @JoinTable({
    name: 'movie_country',
    joinColumn: { name: 'country_shortName' },
    inverseJoinColumn: { name: 'movie_id' },
  })
  movie: Movie[];
}
