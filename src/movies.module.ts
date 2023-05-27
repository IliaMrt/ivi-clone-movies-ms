import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesController } from './movies.controller';
import { Movie } from './movies.entity';
import { MoviesService } from './movies.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CountriesModule } from './countries/countries.module';
import { Country } from './countries/entity/country.entity';
// import { CountriesService } from './countries/countries.service';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    ClientsModule.register([
      {
        name: 'PERSONS',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL],
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
          urls: [process.env.RMQ_URL],
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
          urls: [process.env.RMQ_URL],
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
          urls: [process.env.RMQ_URL],
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
          urls: [process.env.RMQ_URL],
          queue: 'toGenresMs',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD.toString(),
      username: process.env.POSTGRES_USER.toString(),
      database: process.env.POSTGRES_DB,
      entities: [Movie, Country],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Movie, Country]),
    CountriesModule,
    ConfigModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
