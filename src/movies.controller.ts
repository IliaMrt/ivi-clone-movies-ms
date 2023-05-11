import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { Movie } from './movies.entity';
import { MoviesService } from './movies.service';
import { MovieDto } from './dto/movie.dto';
import { MovieFilterDto } from './dto/movie-filter.dto';

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @EventPattern({ cmd: 'getMovies' })
  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: Movie[]; amount: number }> {
    return await this.moviesService.getMovies(dto);
  }

  @MessagePattern({ cmd: 'deleteMovie' })
  async deleteMovie(id: number) {
    console.log('Movies MS - Controller - deleteMovie at', new Date());
    return await this.moviesService.deleteMovie(id);
  }

  @MessagePattern({ cmd: 'editMovie' })
  async editMovie(dto: MovieDto) {
    console.log('Movies MS - Controller - editMovie at', new Date());
    return await this.moviesService.editMovie(dto);
  }

  @MessagePattern({ cmd: 'createMovie' })
  async createMovie(dto: MovieDto): Promise<Movie> {
    console.log('Movies MS - Controller - deleteMovie at', new Date());
    return await this.moviesService.createMovie(dto);
  }

  @MessagePattern({ cmd: 'getMovieById' })
  async getMovieById(id: number): Promise<Movie> {
    console.log('Movies MS - Controller - getMovieById at', new Date());
    return await this.moviesService.getMovieById(id);
  }
}
