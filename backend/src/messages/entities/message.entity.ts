// src/messages/entities/message.entity.ts
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

  // ✅ 1. 수신자가 익명이었는지 여부를 기록하는 컬럼 추가
  @Column({ default: false })
  isRecipientAnonymous: boolean;

  @Column({ nullable: true })
  sourcePostTitle: string; // 쪽지가 시작된 게시글 제목

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.sentMessages, { eager: true })
  sender: User;

  @ManyToOne(() => User, user => user.receivedMessages, { eager: true })
  recipient: User;
}
