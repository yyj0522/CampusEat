import { Module } from '@nestjs/common';
import { UniversitiesController } from './universities.controller';
import { University } from './entities/university.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([University])], 
  controllers: [UniversitiesController],
  providers: [], 
})
export class UniversitiesModule {}