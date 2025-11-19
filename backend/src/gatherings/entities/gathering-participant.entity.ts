import {
  Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne,
} from 'typeorm';
import { Gathering } from './gathering.entity';
import { User } from '../../users/user.entity';

@Entity()
export class GatheringParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Gathering, (gathering) => gathering.participants, { onDelete: 'CASCADE' })
  gathering: Gathering;

  @ManyToOne(() => User, (user) => user.participations, { onDelete: 'CASCADE' })
  user: User;
}
