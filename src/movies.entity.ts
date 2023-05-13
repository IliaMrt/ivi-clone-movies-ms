import { Entity, Column, PrimaryColumn } from 'typeorm';
// import { ApiProperty } from '@nestjs/swagger';
import { CountryDto } from './dto/country.dto';
import { PersonsDto } from './dto/persons.dto';

@Entity("ivi-movies")
export class Movie {
  @PrimaryColumn({ type: 'numeric' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nameru: string;

  @Column({ type: 'varchar', length: 255 })
  nameen: string;
  @Column({ type: 'varchar', length: 255 })
  type: string;
  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  country: CountryDto[];
  // genres: genre[],
  @Column({ type: 'text' })
  trailer: string;

  @Column({ type: 'simple-array' })
  similarmovies: number[];

  @Column({ type: 'numeric' })
  year: number;

  @Column({ type: 'numeric' })
  rating: number;

  @Column({ type: 'numeric' })
  ratingcount: number;

  @Column({ type: 'numeric' })
  agerating: number;

  @Column({ type: 'text' })
  poster: string;

  @Column({ type: 'numeric' })
  duration: number;

  @Column({ type: 'text' })
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
