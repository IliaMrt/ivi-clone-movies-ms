import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movies.entity';
import { MovieDto } from './dto/movie.dto';
import { GetMovieDto } from './dto/getMovie.dto';
// import { AUTH_SERVICE, GENRES_SERVICE } from "./constants/services";
// import { COMMENTS_SERVICE } from "./constants/services";
// import { PERSONS_SERVICE } from "./constants/services";
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MovieFilterDto } from './dto/movie-filter.dto';

@Injectable()
export class MoviesService {
  constructor(
    @Inject('GENRES') private genresClient: ClientProxy,
    @Inject('PERSONS') private personsClient: ClientProxy,
    @Inject('AUTH') private authClient: ClientProxy,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async getMovies(
    dto: MovieFilterDto,
  ): Promise<{ result: Movie[]; amount: number }> {
    console.log('Movies MS - Service - getMovies at', new Date());
    let orderDirection;
    const countryMap = new Map([
      ['jp', 'Япония'],
      ['fr', 'Франция'],
      ['ru', 'Россия'],
    ]);
    const sortMap = new Map([
      ['new', 'CreatedAt'],
      ['imdb', 'rating.imdb'],
      ['boxoffice', ''],
    ]);
    const years = ['2000-2020'];
    const rating = 8;
    const ids = [];
    const partName = 'е';
    for (let i = 0; i < 600; i++) {
      ids.push(i);
    }

    const getGenres = [341];
    const movies = await this.moviesRepository.createQueryBuilder();
    if (!getGenres) {
      movies.andWhere(`id in (:...genres)`, { genres: getGenres });
    }
    if (!ids) {
      //тестовый фильтр, в продакшене не нужен, удалить
      movies.andWhere(`id in (:...ids)`, { ids: ids });
    }

    if (dto.rating) {
      movies.andWhere('"rating.kp" >= :rating', { rating: rating });
    }

    if (partName) {
      movies.andWhere('name like :name', { name: '%' + partName + '%' });
    }

    if (dto.year) {
      const years = dto.year.split('-');
      movies.andWhere('year >= :start', { start: years[0] });
      if (years[1]) {
        movies.andWhere('year <= :end', { end: years[1] });
      }
    }

    if (dto.country) {
      const temp = dto.country.split(' ');
      const countries = [];
      temp.forEach((c) => countries.push({ name: countryMap.get(c) }));
      console.log(countries);
      movies.andWhere('countries&&:c', { c: countries });
    }

    const totalAmountOfFilms = (await movies.getMany()).length;

    const order = sortMap[dto.sort] || 'id';

    if (!orderDirection) orderDirection = 'ASC';

    const pagination = dto.pagination.length > 0 ? dto.pagination : [0, 10];

    movies.take(pagination[1]);
    movies.skip(pagination[0] * pagination[1]);
    movies.orderBy(order, orderDirection);

    const result = await movies.getMany();

    const resultIds = result.map((movie) => movie.id);

    // let genresForResult:any = lastValueFrom(await this.genresClient
    //   .send("get_genres_by_ids", resultIds));

    // let personsForResult = await this.personsClient
    //   .send("get_persons_by_ids",resultIds);

    const genresForResult = {
      300: ['Драма', 'Хентай'],
      301: ['Комедия'],
      341: ['Аниме '],
    }; //для отладки, удалить и ниже - тоже!

    const personsForResult = {
      300: {
        '{"id":6915,"photo":"https://st.kp.yandex.net/images/actor_iphone/iphone360_6915.jpg","name":"Сигурни Уивер","enName":"Sigourney Weaver","profession":"актеры","enProfession":"actor"}':
          's',
      },
      341: { actors: 'Всякие актёры' },
    };

    result.forEach((value) => {
      value.genres = genresForResult[value.id];
      value.persons = personsForResult[value.id];
    });

    return { result: result, amount: totalAmountOfFilms }; //[result.map(movie => [movie.name/*, movie.id, movie.countries*/]), totalAmountOfFilms];
  }

  async createMovie(dto: MovieDto) {
    console.log('Movies MS - Service - createMovies at', new Date());

    const movie = await this.moviesRepository.save(dto);

    this.genresClient.send('set_genres_to_movie', {
      movie_id: movie.id,
      genres: dto.genres,
    });

    return movie;
  }

  async getMovieById(id: number): Promise<Movie> {
    console.log('Movies MS - Service - getMovieById at', new Date());

    const movie = await this.moviesRepository.findOne({ where: { id: id } });
    const genre = await lastValueFrom(
      this.genresClient.send('get_genre', { data: movie.id }),
    );
    movie.genres = genre;
    return movie;
  }

  async deleteMovie(id: number) {
    console.log('Movies MS - Service - createMovie at', new Date());

    return await this.moviesRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: id })
      .execute();
  }

  async editMovie(dto: MovieDto) {
    const edit = await this.moviesRepository.createQueryBuilder().update().set({
      'backdrop.previewUrl': dto.backdropPreviewUrl,
      'backdrop.url': dto.backdropUrl,
      'externalId.imdb': dto.externalIdKpHD,
      'externalId.kpHD': dto.externalIdKpHD,
      'logo.url': dto.logoUrl,
      'poster.previewUrl': dto.posterPreviewUrl,
      'poster.url': dto.posterUrl,
      'premiere.country': dto.premiereCountry,
      'premiere.world': dto.premiereWorld,
      'rating.await': dto.ratingAwait,
      'rating.filmCritics': dto.ratingFilmCritics,
      'rating.imdb': dto.ratingImdb,
      'rating.kp': dto.ratingKp,
      'rating.russianFilmCritics': dto.ratingRussianFilmCritics,
      'videos.teasers': dto.videosTeasers,
      'videos.trailers': dto['videos.trailers'],
      'votes.await': dto.votesAwait,
      'votes.filmCritics': dto.votesFilmCritics,
      'votes.imdb': dto.votesImdb,
      'votes.kp': dto.votesKp,
      'votes.russianFilmCritics': dto.votesRussianFilmCritics,
      'watchability.items': dto.watchabilityItems,
      ageRating: dto.ageRating,
      alternativeName: dto.alternativeName,
      countries: dto.countries,
      description: dto.description,
      enName: dto.enName,
      facts: dto.facts,
      genres: dto.genres,
      id: dto.id,
      movieLength: dto.movieLength,
      name: dto.name,
      names: dto.names,
      persons: dto.persons,
      productionCompanies: dto.productionCompanies,
      ratingMpaa: dto.ratingMpaa,
      seasonsInfo: dto.seasonsInfo,
      sequelsAndPrequels: dto.sequelsAndPrequels,
      shortDescription: dto.shortDescription,
      similarMovies: dto.similarMovies,
      slogan: dto.slogan,
      status: dto.status,
      top10: dto.top10,
      top250: dto.top250,
      type: dto.type,
      typeNumber: dto.typeNumber,
      year: dto.year,
    });
    edit.where('id=:id', { id: dto.id });
    return await edit.execute();
  }
}
