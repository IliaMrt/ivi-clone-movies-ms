import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { Movie } from './movies.entity';
import { MoviesService } from './movies.service';
import { MovieFilterDto } from './dto/movie-filter.dto';
import { FullMovieDto } from "./dto/full.movie.dto";
import { MiniMovieDto } from "./dto/mini-movie.dto";

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @EventPattern({ cmd: 'getMovies' })
  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: MiniMovieDto[]; amount: number }> {
    console.log('Movies MS - Controller - getMovies at', new Date());
    return await this.moviesService.getMovies(dto);
  }

  @MessagePattern({ cmd: 'deleteMovie' })
  async deleteMovie(id: { id:number }) {
    console.log('Movies MS - Controller - deleteMovie at', new Date());
    return await this.moviesService.deleteMovie(id.id);
  }

  @MessagePattern({ cmd: 'editMovie' })
  async editMovie(dto: FullMovieDto) {
    console.log('Movies MS - Controller - editMovie at', new Date());
    return await this.moviesService.editMovie(dto);
  }

  @MessagePattern({ cmd: 'createMovie' })
  async createMovie(dto: FullMovieDto): Promise<Movie> {
    console.log('Movies MS - Controller - createMovie at', new Date());
    return await this.moviesService.createMovie(dto);
  }

  @MessagePattern({ cmd: 'getMovieById' })
  async getMovieById(id: number): Promise<any> {
    console.log('Movies MS - Controller - getMovieById at', new Date());
    return await this.moviesService.getMovieById(id);
  }
}
