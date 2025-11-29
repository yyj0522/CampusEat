import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Timetable } from './timetable.entity';

@Entity('timetable_lectures')
export class TimetableLecture {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Timetable, (timetable) => timetable.lectures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timetableId' })
  timetable: Timetable;

  @Column({ nullable: true })
  lectureId: number;

  @Column()
  courseName: string;

  @Column()
  professor: string;

  @Column({ nullable: true })
  courseCode: string;

  // [유지] 내 시간표에는 0.5학점이 들어갈 수 있어야 하므로 float 타입을 유지합니다.
  @Column({ type: 'float', default: 0 })
  credits: number;

  @Column('jsonb', { nullable: true })
  schedule: any;

  @Column({ nullable: true })
  color: string;
}