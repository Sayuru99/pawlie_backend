import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<Review> {
    // Check if user already reviewed this person
    const existingReview = await this.reviewRepository.findOne({
      where: {
        reviewer_id: reviewerId,
        reviewed_user_id: createReviewDto.reviewed_user_id,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this user');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewer_id: reviewerId,
    });
    
    return this.reviewRepository.save(review);
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewed_user_id: userId },
      relations: ['reviewer'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'reviewed_user'],
    });
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    
    return review;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reviewRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Review not found');
    }
  }

  async getAverageRating(userId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.reviewed_user_id = :userId', { userId })
      .getRawOne();
    
    return parseFloat(result.average) || 0;
  }
}