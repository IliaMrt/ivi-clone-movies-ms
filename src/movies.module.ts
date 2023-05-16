import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesController } from './movies.controller';
import { Movie } from './movies.entity';
import { MoviesService } from './movies.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  databaseHost,
  databaseName,
  databasePassword,
  databasePort,
  databaseUser,
} from './environment/variables';

@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true,
    //   envFilePath: ".env"
    // }),
    // RmqModule,
    ClientsModule.register([
      {
        name: 'PERSONS',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'], // [process.env.RABBIT_MQ_URL],
          queue: 'toPersonsMs',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'FILES',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'], //[process.env.RABBIT_MQ_URL],
          queue: 'toFilesMs',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'COMMENTS',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'], //[process.env.RABBIT_MQ_URL],
          queue: 'toCommentsMs',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'AUTH',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URL],
          queue: 'AUTh',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'GENRES',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'], //[process.env.RABBIT_MQ_URL],
          queue: 'toGenresMs',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: databaseHost,
      port: Number(databasePort),
      username: databaseUser,
      password: databasePassword.toString(),
      database: 'moviesdb', //databaseName,
      entities: [Movie],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
