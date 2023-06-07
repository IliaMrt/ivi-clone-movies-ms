import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies.entity';
import { Country } from './entity/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Country])],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
