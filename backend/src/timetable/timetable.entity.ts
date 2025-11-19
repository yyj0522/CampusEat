import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TimetableLecture } from './timetable-lecture.entity';

@Entity()
export class Timetable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  year: number;

  @Column()
  semester: string;

  @Column({ default: false })
  isPrimary: boolean;

  @ManyToOne(() => User, (user) => user.timetables, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => TimetableLecture, (lecture) => lecture.timetable, { cascade: true })
  lectures: TimetableLecture[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}