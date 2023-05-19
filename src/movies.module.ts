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
  rmqUrl,
} from './environment/variables';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PERSONS',
        transport: Transport.RMQ,
        options: {
          urls: [rmqUrl],
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
          urls: [rmqUrl],
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
          urls: [rmqUrl],
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
          urls: [rmqUrl],
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
          urls: [rmqUrl],
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
      database: databaseName,
      entities: [Movie],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
