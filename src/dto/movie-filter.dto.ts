export class MovieFilterDto {
  readonly genre: string;
  readonly country: string;
  readonly year: string;
  readonly rating: number;
  readonly ratingCount: number;
  readonly director: string;
  readonly actor: string;
  readonly sort: string;
  pagination: number[];
}
