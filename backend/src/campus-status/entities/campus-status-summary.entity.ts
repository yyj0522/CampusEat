import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { University } from '../../universities/entities/university.entity';

@Entity()
@Index(['universityId', 'createdAt'])
export class CampusStatusSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('json')
  breakdown: {
    category: string;
    summary: string;
    confidence: number;
    reportCount: number;
  }[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  validUntil: Date;

  @ManyToOne(() => University, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: number;
}