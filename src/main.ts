import { NestFactory } from '@nestjs/core';
import { MoviesModule } from './movies.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
// import { databaseHost, port, rmqUrl } from './environment/variables';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(MoviesModule);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URL],
      queue: 'toMoviesMs',
      queueOptions: {
        durable: false,
      },
    },
  });
  const configService = new ConfigService();
  await app.startAllMicroservices();
  await app.listen(configService.get('APP_PORT'), () => {
    console.log(`Movies MS started on ${process.env.APP_PORT}.`);
    console.log(`Application variables:`);
    console.log(`RabbitMQ address: ${process.env.RMQ_URL}`);
    console.log(`Database host: ${process.env.DB_HOST}`);
  });
}

bootstrap();
