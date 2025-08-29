import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Review } from './entities/review.entity';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created successfully', type: Review })
  async create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() user: User): Promise<Review> {
    if (createReviewDto.reviewed_user_id === user.id) {
      throw new BadRequestException('You cannot review yourself');
    }
    return this.reviewService.create(createReviewDto, user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get reviews for a user' })
  @ApiResponse({ status: 200, description: 'List of reviews', type: [Review] })
  async findByUser(@Param('userId') userId: string): Promise<Review[]> {
    return this.reviewService.findByUser(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const review = await this.reviewService.findOne(id);
    if (review.reviewer_id !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewService.remove(id);
    return { message: 'Review deleted successfully' };
  }
}