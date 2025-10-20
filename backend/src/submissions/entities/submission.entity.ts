// 파일 전체 경로: src/submissions/entities/submission.entity.ts

import { User } from '../../users/user.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Submission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurantName: string;

  @Column()
  location: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 'pending' }) // 'pending', 'approved', 'rejected'
  status: string;

  @Column()
  university: string;

  @CreateDateColumn()
  createdAt: Date;

  // 🌟🌟🌟 추가된 부분: 리뷰 삭제 로직 지원을 위한 필드 🌟🌟🌟
  @Column({ type: 'varchar', nullable: true })
  contextType: string | null; // 'review', 'restaurant' 등을 저장

  @Column({ type: 'varchar', nullable: true })
  contextId: string | null; // 참조하는 엔티티의 ID 저장 (여기서는 review.id)
  // 🌟🌟🌟 추가된 부분 끝 🌟🌟🌟

  @ManyToOne(() => User, user => user.submissions, { eager: true })
  reporter: User; // 제보자
}