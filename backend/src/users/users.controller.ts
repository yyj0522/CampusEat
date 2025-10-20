// 파일 전체 경로: src/users/users.controller.ts

import { Controller, Patch, Body, UseGuards, Get, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from './user.entity';

@Controller('users')
@UseGuards(AuthGuard()) // Users 컨트롤러의 모든 API는 기본적으로 로그인이 필요
export class UsersController {
   constructor(private readonly usersService: UsersService) {}

   @Patch('/profile')
   updateUser(
      @Body() updateUserDto: UpdateUserDto,
      @GetUser() user: User,
   ) {
      return this.usersService.updateUser(updateUserDto, user);
   }

   @Patch('/password')
   changePassword(
      @Body() changePasswordDto: ChangePasswordDto,
      @GetUser() user: User,
   ) {
      return this.usersService.changePassword(changePasswordDto, user);
   }

   @Delete('/me')
   deleteAccount(@GetUser() user: User) {
      return this.usersService.deleteAccount(user);
   }

   @Get('/me/posts')
   getMyPosts(@GetUser() user: User) {
      return this.usersService.getMyPosts(user);
   }

   @Get('/me/comments')
   getMyComments(@GetUser() user: User) {
      return this.usersService.getMyComments(user);
   }
  
   @Get('/me/likes') 
   getMyLikes(@GetUser() user: User) {
      return this.usersService.getMyLikes(user);
   }

   @Get('/me/reviews')
   getMyReviews(@GetUser() user: User) {
     return this.usersService.getMyReviews(user);
    }
}