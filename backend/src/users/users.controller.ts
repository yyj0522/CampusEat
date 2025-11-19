import { Controller, Patch, Body, UseGuards, Get, Delete, Logger, Post, UnauthorizedException, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from './user.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
@UseGuards(AuthGuard()) 
export class UsersController {
   private readonly logger = new Logger(UsersController.name);

   constructor(private readonly usersService: UsersService) {}

   @Patch('profile')
   async updateUser(
      @Body() updateUserDto: UpdateUserDto,
      @GetUser() user: User,
   ) {
      this.logger.log(`User ${user.id} requesting profile update: ${JSON.stringify(updateUserDto)}`);
      return this.usersService.updateUser(updateUserDto, user);
   }

   @Patch('password')
   changePassword(
      @Body() changePasswordDto: ChangePasswordDto,
      @GetUser() user: User,
   ) {
      return this.usersService.changePassword(changePasswordDto, user);
   }

   @Delete('me')
   deleteAccount(@GetUser() user: User) {
      return this.usersService.deleteAccount(user);
   }

   @Get('me/posts')
   getMyPosts(@GetUser() user: User) {
      return this.usersService.getMyPosts(user);
   }

   @Get('me/comments')
   getMyComments(@GetUser() user: User) {
      return this.usersService.getMyComments(user);
   }
 
   @Get('me/likes') 
   getMyLikes(@GetUser() user: User) {
      return this.usersService.getMyLikes(user);
   }

   @Get('me/reviews')
   getMyReviews(@GetUser() user: User) {
     return this.usersService.getMyReviews(user);
    }

   @Post('admin/suspend')
   @UseGuards(AdminGuard)
   suspendUser(
     @Body('userId') userId: number,
     @Body('days') days: number,
     @GetUser() admin: User,
   ) {
     if (admin.role !== 'super_admin' && admin.id === userId) {
        throw new UnauthorizedException('스스로를 정지시킬 수 없습니다.');
     }
     return this.usersService.suspendUser(userId, days);
   }

   @Get('admin')
   @UseGuards(AdminGuard)
   findAll(
     @Query('page') page: number = 1,
     @Query('limit') limit: number = 10,
     @Query('status') status: string,
   ) {
     if (!status) status = '활성';
     return this.usersService.findAll(page, limit, status);
   }

   @Patch('admin/:id/unsuspend')
   @UseGuards(AdminGuard)
   unsuspendUser(
     @Param('id') id: string,
     @GetUser() admin: User,
   ) {
     if (admin.role !== 'super_admin' && admin.id === +id) {
       throw new UnauthorizedException('스스로를 해제할 수 없습니다.');
     }
     return this.usersService.unsuspendUser(+id);
   }
}