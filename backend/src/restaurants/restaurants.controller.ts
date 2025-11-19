import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AuthGuard } from '@nestjs/passport'; 
import { GetUser } from '../auth/get-user.decorator'; 
import { User } from '../users/user.entity'; 

@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Post()
    create(@Body() createRestaurantDto: CreateRestaurantDto) {
        return this.restaurantsService.create(createRestaurantDto);
    }

    @Get()
    findAll() {
        return this.restaurantsService.findAll();
    }

    @Get('university/:universityName')
    findAllByUniversity(@Param('universityName') universityName: string) {
        return this.restaurantsService.findAllByUniversity(universityName);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.restaurantsService.findOne(+id);
    }

    @Post(':restaurantId/like')
    @UseGuards(AuthGuard()) 
    async toggleLike(
        @Param('restaurantId') restaurantId: string,
        @GetUser() user: User,
    ) {
        return this.restaurantsService.toggleLike(+restaurantId, user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
        return this.restaurantsService.update(+id, updateRestaurantDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.restaurantsService.remove(+id);
    }
}