import { Entity, Column, PrimaryColumn, JoinTable, ManyToMany } from 'typeorm';
import { Movie } from '../../movies.entity';

@Entity('country')
export class Country {
  @Column({ type: 'varchar', length: 255 })
  'nameRu': string;

  @Column({ type: 'varchar', length: 255 })
  'nameEn': string;
  @PrimaryColumn({ type: 'varchar', length: 255 })
  'shortName': string;

  @ManyToMany(() => Movie, (movie) => movie.id)
  @JoinTable({
    name: 'movie_country',
    joinColumn: { name: 'country_shortName' },
    inverseJoinColumn: { name: 'movie_id' },
  })
  movie: Movie[];
}
