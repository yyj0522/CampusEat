import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { AuthModule } from '../auth/auth.module';
import { Like } from './entities/like.entity'; 

@Module({
   imports: [
      TypeOrmModule.forFeature([Restaurant, Like]), 
      AuthModule, 
   ],
   controllers: [RestaurantsController],
   providers: [RestaurantsService],
   exports: [RestaurantsService],
})
export class RestaurantsModule {}