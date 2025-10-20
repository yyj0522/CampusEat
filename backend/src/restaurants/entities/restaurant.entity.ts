// 파일 전체 경로: src/restaurants/entities/restaurant.entity.ts

import { User } from '../../users/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Report } from '../../reports/entities/report.entity';
import { University } from '../../universities/entities/university.entity';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { Like } from './like.entity'; // 👈 Like 엔티티 임포트 추가

@Entity()
export class Restaurant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column()
    vicinity: string;

    @Column('decimal', { precision: 10, scale: 7 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'varchar', nullable: true })
    photoUrl: string | null;

    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: 0 })
    reviewCount: number;

    @ManyToOne(() => University, university => university.restaurants, { eager: true, onDelete: 'CASCADE' })
    university: University;

    @OneToMany(() => Review, review => review.restaurant)
    reviews: Review[];

    // 🌟🌟🌟 수정된 부분: ManyToMany 관계를 제거하고 Like 엔티티와의 OneToMany 관계로 대체 🌟🌟🌟
    @OneToMany(() => Like, like => like.restaurant)
    likes: Like[]; // 좋아요 레코드 목록

    // 기존 ManyToMany 관계 제거 (user.entity.ts에서도 제거해야 함)
    // @ManyToMany(() => User, user => user.likedRestaurants)
    // @JoinTable({ name: 'user_liked_restaurants' })
    // likedByUsers: User[];
    // 🌟🌟🌟 수정된 부분 끝 🌟🌟🌟
    
    @OneToMany(() => Report, report => report.reportedRestaurant)
    reports: Report[];
}