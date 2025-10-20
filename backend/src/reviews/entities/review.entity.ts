// 파일 전체 경로: src/reviews/entities/review.entity.ts

import { User } from '../../users/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
// 1. BaseEntity를 import합니다.
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Report } from '../../reports/entities/report.entity'; // 👈 Report 임포트 추가

@Entity()
// 2. Review 클래스가 BaseEntity를 상속받도록 수정합니다.
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

  // 🌟🌟🌟 수정: User 삭제 시 리뷰도 삭제되도록 CASCADE 추가 🌟🌟🌟
  @ManyToOne(() => User, user => user.reviews, { eager: true, onDelete: 'CASCADE' })
  author: User;
    // 🌟🌟🌟 수정 끝 🌟🌟🌟

  @ManyToOne(() => Restaurant, restaurant => restaurant.reviews, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  // 🌟🌟🌟 추가: Report와의 관계 (Report에서 Review를 참조하는 경우) 🌟🌟🌟
  @OneToMany(() => Report, report => (report as any).reportedReview) // Report 엔티티의 reportedReview 필드 참조
  reports: Report[];
}