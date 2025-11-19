import { User } from '../../users/user.entity';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Answer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.answers, {
    eager: true,
    onDelete: 'CASCADE',
  })
  author: User;

  @ManyToOne(() => Inquiry, inquiry => inquiry.answers, { onDelete: 'CASCADE' })
  inquiry: Inquiry;
}