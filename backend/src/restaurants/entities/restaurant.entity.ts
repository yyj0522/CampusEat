import { Review } from '../../reviews/entities/review.entity';
import { Report } from '../../reports/entities/report.entity';
import { University } from '../../universities/entities/university.entity';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { Like } from './like.entity'; 

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

    @OneToMany(() => Like, like => like.restaurant)
    likes: Like[]; 

    @OneToMany(() => Report, report => report.reportedRestaurant)
    reports: Report[];
}