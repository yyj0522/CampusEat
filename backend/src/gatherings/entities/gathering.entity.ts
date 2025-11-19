import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { GatheringParticipant } from './gathering-participant.entity';
import { GatheringMessage } from './gathering-message.entity';

export enum GatheringType {
  MEETING = 'meeting',
  CARPOOL = 'carpool',
}

@Entity()
export class Gathering {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: GatheringType, default: GatheringType.MEETING })
  type: GatheringType;

  @Column()
  university: string;

  @Column({ type: 'timestamptz' })
  datetime: Date;

  @Column()
  location: string;

  @Column({ nullable: true })
  departure?: string;

  @Column({ nullable: true })
  arrival?: string;

  @Column({ default: 4 })
  maxParticipants: number;

  @Column({ default: 0 })
  participantCount: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ nullable: true })
  purpose?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'int', array: true, default: '{}' })
  kickedUserIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  creator: User;

  @OneToMany(() => GatheringParticipant, (participant) => participant.gathering)
  participants: GatheringParticipant[];

  @OneToMany(() => GatheringMessage, (message) => message.gathering)
  messages: GatheringMessage[];
}