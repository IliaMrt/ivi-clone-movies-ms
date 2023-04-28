import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity(`kpmovies1`)
export class Movie {
  /*  @PrimaryGeneratedColumn()
  _id: number;*/
  /*
  @Column({ type: 'numeric' })
  authorId: number;

  @Column({ type: 'text', default: '' })
  text: string;

  @Column({ type: 'numeric', default: 0 })
  likes: number;

  @Column({ type: 'varchar', length: 255 })
  essenceTable: string;

  @Column({ type: 'numeric' })
  essenceId: number;*/
/*
  @Column({ type: 'simple-array' })
  "videos.trailers": string[];*/


  @Column({ type: 'text', array: true })
  "videos.trailers": object[];

  @Column({ type: 'text', array: true })
  "videos.teasers": string[];

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  "externalId.kpHD": string;

  @Column({ type: 'text' })
  "externalId.imdb": string;

  @Column({ type: 'numeric' })
  "externalId.tmdb": number;

  @Column({ type: 'numeric' })
  "rating.kp": number;

  @Column({ type: 'numeric' })
  "rating.imdb": number;

  @Column({ type: 'numeric' })
  "rating.filmCritics": number;

  @Column({ type: 'numeric' })
  "rating.russianFilmCritics": number;

  @Column({ type: 'numeric' })
  "rating.await": number;

  @Column({ type: 'numeric' })
  "votes.kp": number;

  @Column({ type: 'numeric' })
  "votes.imdb": number;

  @Column({ type: 'numeric' })
  "votes.filmCritics": number;

  @Column({ type: 'numeric' })
  "votes.russianFilmCritics": number;

  @Column({ type: 'numeric' })
  "votes.await": number;

  @Column({ type: 'text' })
  "backdrop.url": string;

  @Column({ type: 'text' })
  "backdrop.previewUrl": string;

  @Column({ type: 'numeric' })
  movieLength: number;

  @Column({  type: 'text', array: true })
  productionCompanies: string[];

  @PrimaryColumn({ type: 'numeric' })
  id: number;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  "premiere.country": string;

  @Column({ type: 'text' })
  "premiere.world": string;

  @Column({ type: 'text' })
  slogan: string;

  @Column({ type: 'numeric' })
  year: number;

  @Column({ type: 'text' })
  "poster.url": string;

  @Column({ type: 'text' })
  "poster.previewUrl": string;

  @Column({ type: 'simple-array' })
  facts: string[];

  @Column({  type: 'text', array: true  })
  genres: string[];

  @Column({  type: 'text', array: true  })
  countries: string[];

  @Column({ type: 'simple-array' })
  seasonsInfo: string[];

  @Column({ type: 'text', array: true  })
  persons: string[];

  @Column({ type: 'numeric' })
  typeNumber: number;

  @Column({ type: 'text' })
  alternativeName: string;

  @Column({ type: 'text' })
  enName: string;

  @Column({  type: 'text', array: true })
  names: string[];

  @Column({ type: 'text' })
  ratingMpaa: string;

  @Column({ type: 'text' })
  shortDescription: string;

  @Column({  type: 'text', array: true  })
  similarMovies: string[];

  @Column({ type: 'text', array: true  })
  sequelsAndPrequels: string[];

  @Column({ type: 'text' })
  ageRating: string;

  @Column({ type: 'text' })
  "logo.url": string;

  @Column({ type: 'text' })
  "watchability.items": string;

  @Column({ type: 'text' })
  top10: string;

  @Column({ type: 'text' })
  top250: string;
}
