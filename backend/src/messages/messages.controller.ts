import { Controller, Get, Post, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('messages')
@UseGuards(AuthGuard())
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @GetUser() user: User) {
    return this.messagesService.create(createMessageDto, user);
  }

  @Get('inbox')
  getInbox(@GetUser() user: User) {
    return this.messagesService.getInbox(user);
  }

  @Get('sent')
  getSent(@GetUser() user: User) {
    return this.messagesService.getSent(user);
  }
  
  @Post('read')
  markAsRead(@GetUser() user: User) {
    return this.messagesService.markAsRead(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.messagesService.remove(+id, user);
  }

  @Post('clear-mailbox')
  clearMailbox(@Body('type') type: 'inbox' | 'sent', @GetUser() user: User) {
    return this.messagesService.clearMailbox(type, user);
  }
}

