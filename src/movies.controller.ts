import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Movie } from './movies.entity';
import { MoviesService } from './movies.service';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { FullMovieDto } from './dto/full.movie.dto';
import { MiniMovieDto } from './dto/mini-movie.dto';
import { UpdateMovieDto } from './dto/update.movie.dto';

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @MessagePattern({ cmd: 'getMovies' })
  async getMovies(dto: {
    movieFilterDto: MovieFilterDto;
  }): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Controller - getMovies at', new Date());
    return await this.moviesService.getMovies(dto.movieFilterDto);
  }

  @MessagePattern({ cmd: 'deleteMovie' })
  async deleteMovie(movieId: { movieId: number }) {
    console.log('Movies MS - Controller - deleteMovie at', new Date());
    return await this.moviesService.deleteMovie(movieId.movieId);
  }

  @MessagePattern({ cmd: 'updateMovie' })
  async updateMovie(input: {
    movieId: number;
    updateMovieDto: UpdateMovieDto;
  }) {
    console.log('Movies MS - Controller - editMovie at', new Date());
    return await this.moviesService.updateMovie(
      input.movieId,
      input.updateMovieDto, //todo
    );
  }

  @MessagePattern({ cmd: 'createMovie' })
  async createMovie(dto: {
    createMovieDto: FullMovieDto;
  }): Promise<{ movie: Movie; errors: any }> {
    console.log('Movies MS - Controller - createMovie at', new Date());
    return await this.moviesService.createMovie(dto.createMovieDto);
  }

  @MessagePattern({ cmd: 'getMovieById' })
  async getMovieById(movieId: { movieId: number }): Promise<any> {
    console.log('Movies MS - Controller - getMovieById at', new Date());
    return await this.moviesService.getMovieById(movieId.movieId);
  }

  @MessagePattern({ cmd: 'getAllCountries' })
  async getAllCountries(): Promise<any> {
    console.log('Movies MS - Controller - getAllCountries at', new Date());
    return await this.moviesService.getAllCountries();
  }

  @MessagePattern({ cmd: 'fillCountries' })
  async fillCountries(): Promise<any> {
    console.log('Movies MS - Controller - fillCOuntries at', new Date());
    return await this.moviesService.fillCountries();
  }
}
