export class MovieFilterDto {
  ids: number[];
  readonly genre: string;
  readonly country: string; // короткие наименования стран из countriesList, разделитель "+"
  readonly year: string; //одно число XXXX - с года XXXX, два числа через дефис XXXX-YYYY - поиск в интервале
  readonly rating: number;
  readonly ratingCount: number;
  readonly director: string;
  readonly actor: string;
  readonly sort: string;
  readonly pagination: number[]; //два числа: номер страницы и количество записей на странице
  readonly partName: string; //часть имени, любая последовательность символов
}
