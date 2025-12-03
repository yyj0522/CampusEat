import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export class ScheduleItem {
  @Column()
  day: string;

  @Column('simple-array')
  periods: number[];

  @Column()
  classroom: string;
}

@Entity('lectures')
@Index(['university', 'year', 'semester', 'courseCode'])
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  university: string;

  @Column()
  campus: string;

  @Column()
  department: string;

  @Column()
  major: string;

  @Column()
  year: number;

  @Column()
  semester: string;

  @Column()
  group: string;

  @Column()
  courseCode: string;

  @Column()
  courseName: string;

  @Column({ default: 0 })
  hours: number;

  @Column({ type: 'float', default: 0 })
  credits: number;

  @Column({ default: 0 })
  capacity: number;

  @Column()
  professor: string;

  @Column('jsonb')
  schedule: ScheduleItem[];

  @Column({ default: 'Major' })
  courseType: string;
}