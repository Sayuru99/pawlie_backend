import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Explore')
@Controller('explore')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  @ApiOperation({ summary: 'Get trending content and recommendations' })
  @ApiResponse({ status: 200, description: 'Trending posts, pets, and users' })
  async getExplore(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.exploreService.getExploreContent(user.id, pagination);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending posts' })
  @ApiResponse({ status: 200, description: 'List of trending posts' })
  async getTrending(@Query() pagination: PaginationDto) {
    return this.exploreService.getTrendingPosts(pagination);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Personalized recommendations' })
  async getRecommendations(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.exploreService.getRecommendations(user.id, pagination);
  }
}