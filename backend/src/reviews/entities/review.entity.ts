import { User } from '../../users/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';

@Entity()
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;
  
  @Column()
  rating: number;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.reviews, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Restaurant, restaurant => restaurant.reviews, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  @OneToMany(() => Report, report => (report as any).reportedReview) 
  reports: Report[];
}