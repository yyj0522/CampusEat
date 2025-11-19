import { User } from '../../users/user.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  deletedBySender: boolean;

  @Column({ default: false })
  deletedByRecipient: boolean;

  @Column({ default: false })
  isRecipientAnonymous: boolean;

  @Column({ nullable: true })
  sourcePostTitle: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.sentMessages, {
    eager: true,
    onDelete: 'CASCADE', 
  })
  sender: User;

  @ManyToOne(() => User, user => user.receivedMessages, {
    eager: true,
    onDelete: 'CASCADE', 
  })
  recipient: User;
}