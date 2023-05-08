import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, EventPattern, MessagePattern, Payload } from "@nestjs/microservices";
import { Movie } from "./movies.entity";
import { MoviesService } from "./movies.service";
import { MovieDto } from "./dto/movie.dto";
import { GetMovieDto } from "./dto/getMovie.dto";
import { AUTH_SERVICE } from "./constants/services";
import { MovieFilterDto } from "./dto/movie-filter.dto";

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {
  }

  @EventPattern({ cmd: "getMovies" })
  async getMovies(data /*: { dto: MovieFilterDto }*/): Promise<{ "result": Movie[], "amount": number }> {

    return await this.moviesService.getMovies(data);
  }


  @MessagePattern({ cmd: "deleteMovie" })
  async deleteMovie(id, headers/*: { dto: GetMovieDto }*/
  ) /*: Promise<Movie[]>*/ {
    return await this.moviesService.deleteMovie(id, headers);
  }

  @MessagePattern({ cmd: "editMovie" })
  async editMovie(
    @Payload() dto: MovieDto, headers) {
    return await this.moviesService.editMovie(dto, headers);
  }

  @MessagePattern({ cmd: "createMovie" })
  async createMovie(
    @Payload() dto: MovieDto, headers) /*: Promise<Movie[]>*/ {
    return await this.moviesService.createMovie(dto, headers);
  }

  @MessagePattern({ cmd: "getMovieById" })
  async getMovie(id: number): Promise<Movie> {
    return await this.moviesService.getMovieById(id);
  }


}
