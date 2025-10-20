// 파일 전체 경로: src/reports/entities/report.entity.ts

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
  contextType: string; // 'post', 'comment', 'user', 'restaurant' (게시글 신고 시 'post' 사용)

  @Column({ nullable: true })
  contextId: string; // 신고 대상 ID (게시글 신고 시 게시글 ID 저장)

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.reportsMade, { eager: true })
  reporter: User; // 신고한 사람

  @ManyToOne(() => User, user => user.reportsReceived, { eager: true, nullable: true })
  reportedUser: User | null; // 신고당한 사람 (대상이 유저일 경우)

  @ManyToOne(() => Restaurant, restaurant => restaurant.reports, { eager: false, nullable: true })
  reportedRestaurant: Restaurant | null; // 신고당한 맛집
}