import { RmqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { MoviesModule } from './movies.module';

async function bootstrap() {
  const app = await NestFactory.create(MoviesModule);
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('MOVIES', true));
  await app.startAllMicroservices();
}
bootstrap();
