import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
} from 'typeorm';
import { Trade } from './trade.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bookTitle: string;

  @Column({ nullable: true })
  courseName?: string;

  @Column({ type: 'int' })
  originalPrice: number;

  @Column({ type: 'int' })
  sellingPrice: number;

  @ManyToOne(() => Trade, (trade) => trade.books, { onDelete: 'CASCADE' })
  trade: Trade;
}