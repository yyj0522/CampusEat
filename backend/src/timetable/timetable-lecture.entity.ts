import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Timetable } from './timetable.entity';
import { ScheduleItem } from './lecture.entity';

@Entity()
export class TimetableLecture {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Timetable, (timetable) => timetable.lectures, { onDelete: 'CASCADE' })
  timetable: Timetable;

  @Column({ nullable: true })
  lectureId: number;

  @Column()
  courseName: string;

  @Column()
  professor: string;

  @Column()
  courseCode: string;

  @Column('jsonb')
  schedule: ScheduleItem[];

  @Column({ nullable: true })
  color: string;
}