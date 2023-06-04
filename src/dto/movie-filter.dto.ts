export class MovieFilterDto {
  constructor(years) {
    this.ids = null;
    this.genres = null;
    this.countries = null;
    this.years = years;
    this.rating = null;
    this.ratingCount = null;
    this.director = null;
    this.actor = null;
    this.sort = null;
    this.page = null;
    this.partName = null;
  }

  ids: number[] | string | string[];
  readonly genres: string;
  readonly countries: string;
  readonly years: string;
  readonly rating: number;
  readonly ratingCount: number;
  readonly director: string;
  readonly actor: string;
  readonly sort: string;
  readonly page: number;
  readonly partName: string;
}
