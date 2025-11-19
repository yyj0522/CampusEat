import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class MessagesService {
  async create(createMessageDto: CreateMessageDto, sender: User): Promise<Message> {
    const { recipientId, content, sourcePostTitle, isRecipientAnonymous } = createMessageDto;
    const recipient = await User.findOne({ where: { id: recipientId } });
    if (!recipient) {
      throw new NotFoundException(`Recipient with ID ${recipientId} not found`);
    }
    const message = Message.create({
      content,
      sourcePostTitle,
      sender,
      recipient,
      isRecipientAnonymous: isRecipientAnonymous || false,
    });
    await message.save();
    return message;
  }

  async getInbox(user: User): Promise<Message[]> {
    return Message.find({
      where: { recipient: { id: user.id }, deletedByRecipient: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getSent(user: User): Promise<Message[]> {
    return Message.find({
      where: { sender: { id: user.id }, deletedBySender: false },
      order: { createdAt: 'DESC' },
    });
  }
  
  async markAsRead(user: User): Promise<{ message: string }> {
    await Message.update(
      { recipient: { id: user.id }, isRead: false },
      { isRead: true }
    );
    return { message: 'All messages marked as read' };
  }
  
  async remove(id: number, user: User): Promise<void> {
    const message = await Message.findOne({
        where: { id },
        relations: ['sender', 'recipient'],
    });

    if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.sender.id === user.id) {
        message.deletedBySender = true;
    } 
    else if (message.recipient.id === user.id) {
        message.deletedByRecipient = true;
    } 
    else {
        throw new UnauthorizedException('You do not have permission to delete this message');
    }

    await message.save();
  }

  async clearMailbox(type: 'inbox' | 'sent', user: User): Promise<{ message: string }> {
    if (type === 'inbox') {
      await Message.update({ recipient: { id: user.id } }, { deletedByRecipient: true });
    } else {
      await Message.update({ sender: { id: user.id } }, { deletedBySender: true });
    }
    return { message: 'Mailbox cleared successfully' };
  }
}

