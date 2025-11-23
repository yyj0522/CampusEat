import { Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { UploadsService } from '../uploads/uploads.service';
import { DataSource, Repository } from 'typeorm'; 
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'; 
import { Submission } from '../submissions/entities/submission.entity'; 
import { Report } from '../reports/entities/report.entity'; 

@Injectable()
export class ReviewsService {
    constructor(
        private readonly uploadsService: UploadsService,
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Submission)
        private readonly submissionRepository: Repository<Submission>,
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
    ) {}

    async create(
        restaurantId: number,
        createReviewDto: CreateReviewDto,
        user: User,
        file?: Express.Multer.File,
    ): Promise<Review> {
        
        const result = await this.dataSource.transaction(async (manager) => {
            const RestaurantRepository = manager.getRepository(Restaurant);

            const restaurant = await manager.findOne(Restaurant, { where: { id: restaurantId } });
            if (!restaurant) {
                throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
            }
            
            let imageUrl: string | undefined = undefined;
            if (file) {
                const result = await this.uploadsService.uploadFile('reviews', file);
                imageUrl = result.url;
            }
            
            const review = manager.create(Review, { 
                ...createReviewDto,
                author: user,
                restaurant,
                imageUrl,
            });
            
            const savedReview = await manager.save(review);
            
            await RestaurantRepository.increment({ id: restaurantId }, 'reviewCount', 1);

            return savedReview;
        });

        return result;
    }

    async findAllByRestaurant(restaurantId: number): Promise<Review[]> {
        return this.reviewRepository.find({
            where: { restaurant: { id: restaurantId } },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Review> {
        const review = await this.reviewRepository.findOne({ 
            where: { id }, 
            relations: ['author', 'restaurant'] 
        }); 
        if (!review) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }
        return review;
    }

    async update(
        id: number,
        updateReviewDto: UpdateReviewDto,
        user: User,
    ): Promise<Review> {
        const review = await this.findOne(id);
        if (review.author.id !== user.id) {
            throw new UnauthorizedException('You can only update your own reviews');
        }
        Object.assign(review, updateReviewDto);
        return this.reviewRepository.save(review); 
    }

    async remove(id: number, user: User): Promise<void> {
        const review = await this.findOne(id); 
        
        const isAdmin = user.role === 'sub_admin' || user.role === 'super_admin';

        if (review.author.id !== user.id && !isAdmin) {
            throw new UnauthorizedException('You can only delete your own reviews');
        }
        
        await this.dataSource.transaction(async (manager) => {
            const ReviewRepository = manager.getRepository(Review);
            const RestaurantRepository = manager.getRepository(Restaurant);
            const SubmissionRepository = manager.getRepository(Submission); 
            const ReportRepository = manager.getRepository(Report); 

            const restaurantId = review.restaurant.id;

            try {
                await SubmissionRepository.delete({ contextType: 'review', contextId: String(id) });
                await ReportRepository.delete({ contextType: 'review', contextId: String(id) });
                
                const deleteResult = await ReviewRepository.delete(id); 

                if (deleteResult.affected === 0) { 
                    throw new NotFoundException(`Review with ID ${id} was not found for deletion.`); 
                }
                
                await RestaurantRepository.decrement({ id: restaurantId }, 'reviewCount', 1);

            } catch (error) {
                console.error(`[FATAL DB ERROR - TRAPPED] Review deletion failed for ID ${id}. Full Error:`, error);
                throw new InternalServerErrorException('Review deletion failed due to database constraint or internal error.');
            }
        }).catch(error => {
            if (error instanceof InternalServerErrorException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            console.error(`[TRANSACTION ROLLBACK - FINAL FAIL] Review deletion failed:`, error);
            throw new InternalServerErrorException('Review deletion failed: Transaction rolled back.');
        });
    }
}