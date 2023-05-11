import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MoviesController } from "./movies.controller";
import { Movie } from "./movies.entity";
import { MoviesService } from "./movies.service";
import { ClientsModule, Transport } from "@nestjs/microservices";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    // RmqModule,
    ClientsModule.register([
      {
        name: "PERSONS",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URL],
          queue: "PERSONS",
          queueOptions: {
            durable: false
          }
        }
      },
      {
        name: "AUTH",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URL],
          queue: "AUTh",
          queueOptions: {
            durable: false
          }
        }
      }, {
        name: "GENRES",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URL],
          queue: "GENRES",
          queueOptions: {
            durable: false
          }
        }
      }]),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD.toString(),
      database: process.env.POSTGRES_DB,
      entities: [Movie],
      synchronize: false
    }),
    TypeOrmModule.forFeature([Movie])
  ],
  controllers: [MoviesController],
  providers: [MoviesService]
})
export class MoviesModule {
}