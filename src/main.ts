import { NestFactory } from '@nestjs/core';
import { MoviesModule } from './movies.module';
import { Transport } from "@nestjs/microservices";

async function bootstrap() {
  console.log();
  const msApp = await NestFactory.createMicroservice(MoviesModule, {
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://rabbitmq:5672"],
      queue: "MOVIES",
      queueOptions: {
        durable: true
      }
    }
  });

  await msApp.listen();
}
bootstrap();
