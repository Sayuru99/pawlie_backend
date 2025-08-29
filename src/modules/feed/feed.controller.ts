import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Personalized feed with posts and stories' })
  async getFeed(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.feedService.getPersonalizedFeed(user.id, pagination);
  }
}