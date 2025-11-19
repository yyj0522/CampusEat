import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { User } from '../users/user.entity'; 
import { Like } from './entities/like.entity'; 

@Injectable()
export class RestaurantsService {
      constructor(
            @InjectRepository(Restaurant)
            private readonly restaurantRepository: Repository<Restaurant>,
            @InjectDataSource()
            private readonly dataSource: DataSource,
      ) {}

      create(createRestaurantDto: CreateRestaurantDto) {
            return 'This action adds a new restaurant';
      }

      findAll() {
            return this.restaurantRepository.find();
      }

      async findAllByUniversity(universityName: string): Promise<Restaurant[]> {
            const restaurants = await this.restaurantRepository
                  .createQueryBuilder('restaurant')
                  .leftJoinAndSelect('restaurant.university', 'university') 
                  .where('university.name = :name', { name: universityName })
                  .getMany();

            if (!restaurants || restaurants.length === 0) {
                  console.log(`[Service] ${universityName}에 대한 맛집 데이터가 없습니다.`);
            }

            return restaurants;
      }

      async toggleLike(restaurantId: number, user: User): Promise<{ isLiked: boolean; likeCount: number }> {
        let currentLikeCount: number;
        let isToggled: boolean;
        
            await this.dataSource.transaction(async (manager) => {
                  const RestaurantRepository = manager.getRepository(Restaurant);
                  const LikeRepository = manager.getRepository(Like); 
                  
                  const restaurant = await RestaurantRepository.findOne({ where: { id: restaurantId } });
                  if (!restaurant) {
                        throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
                  }

                  const existingLike = await LikeRepository.findOne({ 
                        where: { 
                              restaurant: { id: restaurantId }, 
                              user: { id: user.id } 
                        } 
                  });

                  if (existingLike) {
                        await LikeRepository.remove(existingLike);
                        await RestaurantRepository.decrement({ id: restaurantId }, 'likeCount', 1);
                isToggled = false;
                currentLikeCount = (restaurant.likeCount || 0) - 1;
                  } else {
                        const newLike = LikeRepository.create({ 
                              restaurant: { id: restaurantId }, 
                              user: user 
                        });
                        await LikeRepository.save(newLike);
                        await RestaurantRepository.increment({ id: restaurantId }, 'likeCount', 1);
                isToggled = true;
                currentLikeCount = (restaurant.likeCount || 0) + 1;
                  }
            });
        
        return { isLiked: isToggled, likeCount: Math.max(0, currentLikeCount) };
      }

      async findOne(id: number) {
            const restaurant = await this.restaurantRepository.findOne({ where: { id } });
            if (!restaurant) {
                  throw new NotFoundException(`ID가 ${id}인 맛집을 찾을 수 없습니다.`);
            }
            return restaurant;
      }

      update(id: number, updateRestaurantDto: UpdateRestaurantDto) {
            return `This action updates a #${id} restaurant`;
      }

      remove(id: number) {
            return `This action removes a #${id} restaurant`;
      }
}