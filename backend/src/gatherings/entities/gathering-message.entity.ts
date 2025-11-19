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

  @Column({ default: false })
  isSystemMessage: boolean;

  @ManyToOne(() => Gathering, (gathering) => gathering.messages, { onDelete: 'CASCADE' })
  gathering: Gathering;

  @ManyToOne(() => User, (user) => user.sentMessages, { nullable: true, onDelete: 'SET NULL' })
  sender: User;
}
