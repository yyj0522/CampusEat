import { User } from '../../users/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  slideImage: string;

  @Column({ nullable: true })
  slideCaption: string;

  @Column({ nullable: true })
  slideCaptionSmall: string;

  @Column({ nullable: true }) 
  slideBackgroundColor: string;

  @Column({ nullable: true })
  authorDisplayName: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  commentCount: number;

  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => User, (user) => user.posts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToMany(() => User, (user) => user.likedPosts)
  likedByUsers: User[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}