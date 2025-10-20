// src/gatherings/entities/gathering-message.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne,
} from 'typeorm';
import { Gathering } from './gathering.entity';
import { User } from '../../users/user.entity';

@Entity()
export class GatheringMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  // ✅ 시스템 메시지 여부를 구분하기 위한 컬럼 추가
  @Column({ default: false })
  isSystemMessage: boolean;

  @ManyToOne(() => Gathering, (gathering) => gathering.messages, { onDelete: 'CASCADE' })
  gathering: Gathering;

  // ✅ 시스템 메시지는 sender가 없을 수 있으므로 nullable: true
  @ManyToOne(() => User, (user) => user.sentMessages, { nullable: true, onDelete: 'SET NULL' })
  sender: User;
}

