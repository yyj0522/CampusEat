// 파일 전체 경로: src/restaurants/restaurants.module.ts

import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { AuthModule } from '../auth/auth.module';
import { Like } from './entities/like.entity'; // 👈 .entity.ts 파일명을 정확히 명시

@Module({
   imports: [
      // 🌟🌟🌟 최종 확인: Restaurant과 Like 엔티티를 모두 등록합니다. 🌟🌟🌟
      TypeOrmModule.forFeature([Restaurant, Like]), 
      AuthModule, 
   ],
   controllers: [RestaurantsController],
   providers: [RestaurantsService],
   exports: [RestaurantsService],
})
export class RestaurantsModule {}