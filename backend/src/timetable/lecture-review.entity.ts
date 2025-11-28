import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Lecture } from './lecture.entity';

@Entity('lecture_reviews')
export class LectureReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column()
  year: number;

  @Column()
  semester: string;

  @Column({ default: true })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Lecture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lectureId' })
  lecture: Lecture;

  @Column()
  lectureId: number;
}