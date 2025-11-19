import { User } from '../../users/user.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Submission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurantName: string;

  @Column()
  location: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 'pending' })
  status: string;

  @Column()
  university: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  contextType: string | null;

  @Column({ type: 'varchar', nullable: true })
  contextId: string | null;

  @ManyToOne(() => User, user => user.submissions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  reporter: User;
}