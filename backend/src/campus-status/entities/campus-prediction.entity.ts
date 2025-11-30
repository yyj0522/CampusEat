import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from '../../universities/entities/university.entity';

@Entity()
@Unique(['universityId', 'dayOfWeek']) 
export class CampusPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dayOfWeek: string; 

  @Column('json')
  timeline: {
    time: string;
    congestion: number;
    category: string;
    summary: string;
  }[];

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => University, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: number;
}