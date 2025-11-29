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

  // 가장 기본적인 설정으로 복구. 
  // 만약 DB 컬럼이 CREDIT(단수)라면 여기서 데이터를 못 가져오고 0이 됩니다.
  // 진단 로그를 확인한 후, 그 이름에 맞춰서 수정할 것입니다.
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