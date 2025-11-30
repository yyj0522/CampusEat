import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { University } from '../../universities/entities/university.entity';

@Entity()
@Index(['universityId', 'createdAt'])
export class CampusStatusMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  category: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ nullable: true })
  weatherCondition: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  authorId: number;

  @ManyToOne(() => University, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: number;
}