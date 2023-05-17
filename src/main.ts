import { NestFactory } from '@nestjs/core';
import { MoviesModule } from './movies.module';
import { Transport } from '@nestjs/microservices';
import { databaseHost, port, rmqUrl } from './environment/variables';

async function bootstrap() {
  const app = await NestFactory.create(MoviesModule);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'toMoviesMs',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port, () => {
    console.log(`Genres MS started on ${port}.`);
    console.log(`Application variables:`);
    console.log(`RabbitMQ address: ${rmqUrl}`);
    console.log(`Database host: ${databaseHost}`);
  });
}

bootstrap();
