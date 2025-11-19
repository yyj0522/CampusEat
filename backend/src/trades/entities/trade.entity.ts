import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, BeforeInsert,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { TradeParticipant } from './trade-participant.entity';
import { TradeMessage } from './trade-message.entity';
import { Book } from './book.entity';

export enum TradeStatus {
  AVAILABLE = 'available',
  TRADING = 'trading',
  COMPLETED = 'completed',
}

@Entity()
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  university: string;

  @Column()
  imageUrl: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: 2 })
  maxParticipants: number;

  @Column({ default: 0 })
  participantCount: number;

  @Column({ type: 'enum', enum: TradeStatus, default: TradeStatus.AVAILABLE })
  status: TradeStatus;

  @Column({ type: 'int', array: true, default: '{}' })
  kickedUserIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  creator: User;

  @OneToMany(() => Book, (book) => book.trade, { cascade: true, eager: true })
  books: Book[];

  @OneToMany(() => TradeParticipant, (participant) => participant.trade, { cascade: true })
  participants: TradeParticipant[];

  @OneToMany(() => TradeMessage, (message) => message.trade, { cascade: true })
  messages: TradeMessage[];

  @BeforeInsert()
  setDefaultParticipantLimit() {
    this.maxParticipants = 2;
  }
}