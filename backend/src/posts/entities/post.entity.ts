// 파일 전체 경로: src/posts/entities/post.entity.ts

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

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  // 🚩 수정: @Column 데코레이터를 제거하여 loadRelationCountAndMap이 동적으로 값을 매핑합니다.
  commentCount: number; 
  
  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  user: User;

  @ManyToMany(() => User, (user) => user.likedPosts)
  likedByUsers: User[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}