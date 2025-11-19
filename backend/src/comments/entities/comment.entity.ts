import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'text', nullable: true })
  likedBy: string | null;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => User, (user) => user.comments, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE', 
  })
  user: User | null;

  @ManyToOne(() => Post, (post) => post.comments, { eager: false, onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.children, { nullable: true, onDelete: 'CASCADE' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];
}