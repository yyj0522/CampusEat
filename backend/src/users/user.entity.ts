import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { Answer } from '../answers/entities/answer.entity';
import { Report } from '../reports/entities/report.entity';
import { Message } from '../messages/entities/message.entity';
import { Review } from '../reviews/entities/review.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Like } from '../restaurants/entities/like.entity';
import { GatheringParticipant } from '../gatherings/entities/gathering-participant.entity';
import { TradeParticipant } from '../trades/entities/trade-participant.entity';
import { TradeMessage } from '../trades/entities/trade-message.entity';
import { Timetable } from '../timetable/timetable.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ select: false })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastNicknameChange: Date;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: '활성' })
  status: string;

  @Column({ nullable: true })
  suspensionEndDate: Date;

  @Column({ nullable: true })
  university: string;

  @Column({ unique: true, nullable: true })
  universityEmail: string;

  @Column({ type: 'varchar', nullable: true })
  verificationCode: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  verificationCodeExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  passwordResetExpiresAt: Date | null;

  @ManyToMany(() => Post, (post) => post.likedByUsers)
  @JoinTable({ name: 'user_liked_posts' })
  likedPosts: Post[];

  @OneToMany(() => Post, (post) => post.user, { eager: false, onDelete: 'CASCADE' })
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user, { onDelete: 'CASCADE' })
  comments: Comment[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.author, { onDelete: 'CASCADE' })
  inquiries: Inquiry[];

  @OneToMany(() => Answer, (answer) => answer.author, { onDelete: 'CASCADE' })
  answers: Answer[];

  @OneToMany(() => Report, (report) => report.reporter, { onDelete: 'CASCADE' })
  reportsMade: Report[];

  @OneToMany(() => Report, (report) => report.reportedUser, { onDelete: 'CASCADE' })
  reportsReceived: Report[];

  @OneToMany(() => Message, (message) => message.sender, { onDelete: 'CASCADE' })
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.recipient, { onDelete: 'CASCADE' })
  receivedMessages: Message[];

  @OneToMany(() => Like, (like) => like.user, { onDelete: 'CASCADE' })
  likes: Like[];

  @OneToMany(() => Review, (review) => review.author, { onDelete: 'CASCADE' })
  reviews: Review[];

  @OneToMany(() => Submission, (submission) => submission.reporter, { onDelete: 'CASCADE' })
  submissions: Submission[];

  @OneToMany(() => GatheringParticipant, (participant) => participant.user, { onDelete: 'CASCADE' })
  participations: GatheringParticipant[];

  @OneToMany(() => TradeParticipant, (participant) => participant.user, { onDelete: 'CASCADE' })
  tradeParticipations: TradeParticipant[];

  @OneToMany(() => TradeMessage, (message) => message.sender, { onDelete: 'CASCADE' })
  sentTradeMessages: TradeMessage[];

  @OneToMany(() => Timetable, (timetable) => timetable.user, { onDelete: 'CASCADE' })
  timetables: Timetable[];
}