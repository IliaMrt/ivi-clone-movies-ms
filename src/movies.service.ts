import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Movie } from "./movies.entity";
import { MovieDto } from "./dto/movie.dto";
import { GetMovieDto } from "./dto/getMovie.dto";
// import { AUTH_SERVICE, GENRES_SERVICE } from "./constants/services";
// import { COMMENTS_SERVICE } from "./constants/services";
// import { PERSONS_SERVICE } from "./constants/services";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";

@Injectable()
export class MoviesService {
  constructor(
    @Inject('GENRES') private genresClient: ClientProxy,

    @Inject('PERSONS') private personsClient: ClientProxy,
    @Inject('AUTH') private authClient: ClientProxy,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>
  ) {
  }


  async getMovies(dto) {
    let order;
    let orderDirection;
    let pagination = [0, 3];
    let countries = [{ name: "Япония" }, { name: "Франция" }, { name: "Россия" }];
    let years = [2000];
    let rating = 8;
    let ids = [];
    let partName = "е";
    for (let i = 0; i < 600; i++) {
      ids.push(i);
    }


    let getGenres = [341];
    let movies = await this.moviesRepository.createQueryBuilder();
    if (getGenres) {
      movies.andWhere(`id in (:...genres)`, { genres: getGenres });

    }
    if (ids) {//тестовый фильтр, в продакшене не нужен, удалить
      movies.andWhere(`id in (:...ids)`, { ids: ids });
    }

    if (rating) {
      movies.andWhere("\"rating.kp\" >= :rating", { rating: rating });
    }

    if (partName) {
      movies.andWhere("name like :name", { name: "%" + partName + "%" });
    }

    if (years) {
      movies.andWhere("year >= :start", { start: years[0] });
      if (years[1]) {
        movies.andWhere("year <= :end", { end: years[1] });
      }
    }

    if (countries) {
      movies.andWhere("countries&&:c", { c: (countries) });
    }

    const totalAmountOfFilms = (await movies.getMany()).length;

    if (!order) order = "name";
    if (!orderDirection) orderDirection = "ASC";

    movies.take(pagination[1]);
    movies.skip(pagination[0] * pagination[1]);
    movies.orderBy(order, orderDirection);

    let result = await movies.getMany();

    const resultIds = result.map(movie => movie.id);

    // let genresForResult:any = lastValueFrom(await this.genresClient
    //   .send("get_genres_by_ids", resultIds));

    // let personsForResult = await this.personsClient
    //   .send("get_persons_by_ids",resultIds);

    let genresForResult = {
      300: ["Драма", "Хентай"],
      301: ["Комедия"],
      341: ["Аниме "]

    };//для отладки, удалить и ниже - тоже!

    let personsForResult = {
      300: { "{\"id\":6915,\"photo\":\"https://st.kp.yandex.net/images/actor_iphone/iphone360_6915.jpg\",\"name\":\"Сигурни Уивер\",\"enName\":\"Sigourney Weaver\",\"profession\":\"актеры\",\"enProfession\":\"actor\"}": "s" },
      341: { actors: "Всякие актёры" }
    };


    result.forEach(value => {
      value.genres = genresForResult[value.id];
      value.persons = personsForResult[value.id];
    });

    return [result.map(movie => [movie.name/*, movie.id, movie.countries*/]), totalAmountOfFilms];
  }

  async createMovie(dto: MovieDto, headers) {
    /*  const isAdmin = lastValueFrom(await this.authClient.send("is_admin", headers));
      if (!isAdmin.status) {
        return {
          status: isAdmin.httpStatus,
          message: isAdmin.message
        };
      }*/ //включить, когда будет МС авторизации


    let movie = await this.moviesRepository.save(dto);

    this.genresClient.send("set_genres_to_movie", {
      movie_id: movie.id,
      genres: dto.genres
    });

    return movie;
  }

  async getMovieById(id) {
    let movie = await this.moviesRepository.findOne({ where: { id: id } });
    let genre = await lastValueFrom(this.genresClient.send("get_genre", { data: movie.id }));
    movie.genres = genre;
    return movie;
  }

  async deleteMovie(id, headers) {

    /*  const isAdmin = lastValueFrom(await this.authClient.send("is_admin", headers));
      if (!isAdmin.status) {
        return {
          status: isAdmin.httpStatus,
          message: isAdmin.message
        };
      }*/ //включить, когда будет МС авторизации

    return await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where("id=:id", { id: id.id })
      .execute();
  }

  async editMovie(dto, headers) {

    /*  const isAdmin = lastValueFrom(await this.authClient.send("is_admin", headers));
      if (!isAdmin.status) {
        return {
          status: isAdmin.httpStatus,
          message: isAdmin.message
        };
      }*/ //включить, когда будет МС авторизации
    return Promise.resolve(undefined);
  }
}
