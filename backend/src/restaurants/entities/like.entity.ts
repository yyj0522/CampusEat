import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm'; // 👈 Unique 임포트 추가
import { Restaurant } from './restaurant.entity';
import { User } from '../../users/user.entity'; // User 엔티티의 경로를 가정합니다.

@Unique(['restaurant', 'user']) // 👈 이 두 컬럼의 조합은 유일해야 함을 명시
@Entity('likes') // 데이터베이스 테이블 이름은 'likes'
export class Like {
    
    @PrimaryGeneratedColumn()
    id: number;

    // 좋아요를 누른 음식점 (다대일 관계)
    @ManyToOne(() => Restaurant, restaurant => restaurant.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    // 좋아요를 누른 사용자 (다대일 관계)
    @ManyToOne(() => User, user => user.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}