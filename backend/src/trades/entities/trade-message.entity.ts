import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne,
} from 'typeorm';
import { Trade } from './trade.entity';
import { User } from '../../users/user.entity';

@Entity()
export class TradeMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isSystemMessage: boolean;

  @ManyToOne(() => Trade, (trade) => trade.messages, { onDelete: 'CASCADE' })
  trade: Trade;

  @ManyToOne(() => User, (user) => user.sentTradeMessages, { nullable: true, onDelete: 'SET NULL' })
  sender: User;
}