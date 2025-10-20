// src/users/user.entity.ts
import {
    BaseEntity, Column, CreateDateColumn, Entity, JoinTable,
    ManyToMany, OneToMany, PrimaryGeneratedColumn,
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

    @OneToMany(() => Post, (post) => post.user, { eager: false })
    posts: Post[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];
    
    @OneToMany(() => Inquiry, inquiry => inquiry.author)
    inquiries: Inquiry[];

    @OneToMany(() => Answer, answer => answer.author)
    answers: Answer[];
    
    @OneToMany(() => Report, report => report.reporter)
    reportsMade: Report[];

    @OneToMany(() => Report, report => report.reportedUser)
    reportsReceived: Report[];
    
    @OneToMany(() => Message, message => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, message => message.recipient)
    receivedMessages: Message[];
    
    @OneToMany(() => Like, like => like.user)
    likes: Like[]; 

    @OneToMany(() => Review, review => review.author)
    reviews: Review[];
    
    @OneToMany(() => Submission, submission => submission.reporter)
    submissions: Submission[];

    // ✅ 2. 오류 해결: GatheringParticipant와의 관계 설정을 위해 누락된 속성을 추가합니다.
    @OneToMany(() => GatheringParticipant, (participant) => participant.user)
    participations: GatheringParticipant[];
}
