import { TypeOrmModule } from '@nestjs/typeorm';

export const TypeORMTestingModule = (entities: any[]) =>
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username:'postgres',// process.env.POSTGRES_USER,
    password: '123456', // process.env.POSTGRES_PASSWORD.toString(),
    database: 'undefined_tests',//${process.env.POSTGRES_DB}_tests`,
    entities: [...entities],
    synchronize: false,
    dropSchema: true,
  });
