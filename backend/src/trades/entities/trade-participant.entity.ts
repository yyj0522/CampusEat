import {
  Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne,
} from 'typeorm';
import { Trade } from './trade.entity';
import { User } from '../../users/user.entity';

@Entity()
export class TradeParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Trade, (trade) => trade.participants, { onDelete: 'CASCADE' })
  trade: Trade;

  @ManyToOne(() => User, (user) => user.tradeParticipations, { onDelete: 'CASCADE' })
  user: User;
}