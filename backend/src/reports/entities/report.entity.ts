import { User } from '../../users/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Report extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reason: string;

  @Column('text', { nullable: true })
  details: string;

  @Column({ nullable: true })
  contextType: string;

  @Column({ nullable: true })
  contextId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.reportsMade, {
    eager: true,
    onDelete: 'CASCADE', 
  })
  reporter: User;

  @ManyToOne(() => User, user => user.reportsReceived, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  reportedUser: User | null;

  @ManyToOne(() => Restaurant, restaurant => restaurant.reports, { eager: false, nullable: true })
  reportedRestaurant: Restaurant | null;
}