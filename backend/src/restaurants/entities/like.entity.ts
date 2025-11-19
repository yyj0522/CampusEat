import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm'; 
import { Restaurant } from './restaurant.entity';
import { User } from '../../users/user.entity'; 

@Unique(['restaurant', 'user']) 
@Entity('likes') 
export class Like {
    
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Restaurant, restaurant => restaurant.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @ManyToOne(() => User, user => user.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}