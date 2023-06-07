import { PersonsDto } from './persons.dto';

export class FullMoviePersonsDto {
  constructor(persons) {
    //по запросу @hvnsonn от фронта возвращаем пустой массив или значение в персонах
    this.actors = persons == null ? [] : persons.actors;
    this.director = persons == null ? [] : persons.director;
    this.editor = persons == null ? [] : persons.editor;
    this.composer = persons == null ? [] : persons.composer;
    this.operator = persons == null ? [] : persons.operator;
    this.producer = persons == null ? [] : persons.producer;
  }

  director: PersonsDto[];
  actors: PersonsDto[];
  producer: PersonsDto[];
  editor: PersonsDto[];
  operator: PersonsDto[];
  composer: PersonsDto[];
}
