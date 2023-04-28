import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, EventPattern, MessagePattern, Payload } from "@nestjs/microservices";
import { Movie } from "./movies.entity";
import { MoviesService } from "./movies.service";
import { MovieDto } from "./dto/movie.dto";
import { GetMovieDto } from "./dto/getMovie.dto";
import { AUTH_SERVICE } from "./constants/services";

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {
  }

  @MessagePattern("get_movies")
  async getMovies(
    @Payload() data /*: { dto: GetMovieDto }*/
  ) /*: Promise<Movie[]>*/ {
    const a = await this.moviesService.getMovies(data /*data.dto*/);
    return a;
  }


  @MessagePattern("delete_movie")
  async deleteMovie(id, headers/*: { dto: GetMovieDto }*/
  ) /*: Promise<Movie[]>*/ {
    return await this.moviesService.deleteMovie(id, headers);
  }

  @MessagePattern("edit_movie")
  async editMovie(
    @Payload() dto: MovieDto, headers) {
    return await this.moviesService.editMovie(dto,headers);
  }

  @MessagePattern("create_movie")
  async createMovie(
    @Payload() dto: MovieDto, headers) /*: Promise<Movie[]>*/ {
    return await this.moviesService.createMovie(dto,headers);
  }

  @MessagePattern("get_movie_by_id")
  async getMovie(
    @Payload() id /*: { dto: GetMovieDto }*/
  ) /*: Promise<Movie[]>*/ {
    return await this.moviesService.getMovieById(id);
  }


}
