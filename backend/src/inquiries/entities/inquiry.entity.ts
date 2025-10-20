// 파일 전체 경로: src/inquiries/entities/inquiry.entity.ts
import { User } from '../../users/user.entity';
import { Answer } from '../../answers/entities/answer.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Inquiry extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  replyEmail: string;

  // 🌟 파일 URL 저장 필드
  @Column({ type: 'varchar', nullable: true })
  fileUrl: string | null;

  // 🌟 파일 이름 필드
  @Column({ type: 'varchar', nullable: true })
  fileName: string | null;

  // ✅ 새로 추가: 파일 Key (S3에서 실제로 파일을 찾는 고유 식별자)
  @Column({ type: 'varchar', nullable: true })
  fileKey: string | null;

  @Column({ default: 'pending' }) // 'pending', 'answered'
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.inquiries, { eager: true })
  author: User;

  @OneToMany(() => Answer, (answer) => answer.inquiry)
  answers: Answer[];
}
