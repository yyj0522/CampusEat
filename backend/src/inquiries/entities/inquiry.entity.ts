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

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', nullable: true })
  fileKey: string | null;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.inquiries, {
    eager: true,
    onDelete: 'CASCADE', // 이 옵션을 추가합니다.
  })
  author: User;

  @OneToMany(() => Answer, (answer) => answer.inquiry)
  answers: Answer[];
}