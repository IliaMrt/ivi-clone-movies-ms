import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ivi-movies5')
export class Movie {
  @PrimaryGeneratedColumn('increment')
  id: number;
  //TODO nullable удалить из продакшена
  @Column({ nullable: true, type: 'varchar', length: 255 })
  nameru: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  nameen: string;
  @Column({ nullable: true, type: 'varchar', length: 255 })
  type: string;
  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  country: string[]; // CountryDto[];
  // genres: genre[],
  @Column({ nullable: true, type: 'text' })
  trailer: string;

  @Column({ nullable: true, type: 'simple-array' })
  similarmovies: number[];

  @Column({ type: 'numeric' })
  year: number;

  @Column({ nullable: true, type: 'numeric' })
  rating: number;

  @Column({ nullable: true, type: 'numeric' })
  ratingcount: number;

  @Column({ nullable: true, type: 'numeric' })
  agerating: number;

  @Column({ nullable: true, type: 'text' })
  poster: string;
  //TODO nullable удалить из продакшена
  @Column({ nullable: true, type: 'numeric' })
  duration: number;

  @Column({ nullable: true, type: 'text' })
  slogan: string;

  /*  @Column({ type: 'simple-array' })
  director: PersonsDto[];

  @Column({ type: 'simple-array' })
  actors: PersonsDto[];

  @Column({ type: 'simple-array' })
  producer: PersonsDto[];

  @Column({ type: 'simple-array' })
  cinematographer: PersonsDto[];

  @Column({ type: 'simple-array' })
  screenwriter: PersonsDto[];

  @Column({ type: 'simple-array' })
  composer: PersonsDto[];*/
}
