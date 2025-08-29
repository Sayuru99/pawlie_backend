import { Controller, Get, Param, UseGuards, ForbiddenException, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { PostService } from '../post/post.service';
import { PostAnalytic } from './entities/post-analytic.entity';
import { LogEventDto } from './dto/log-event.dto';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserType } from '@/common/enums/user-type.enum';
import { RolesGuard } from '@/common/guards/roles.guard';
import { BusinessAnalyticsSummaryDto } from './dto/business-analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    // PostService might not be needed if we transition away from post-specific analytics endpoints
    private readonly postService: PostService,
  ) {}

  @Get('summary')
  @Roles(UserType.PROFESSIONAL, UserType.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a summary of business analytics for the logged-in user.' })
  @ApiResponse({ status: 200, description: 'Business analytics summary.', type: BusinessAnalyticsSummaryDto })
  getBusinessSummary(
    @CurrentUser() user: User,
    @Query('days') days?: number,
  ): Promise<BusinessAnalyticsSummaryDto> {
    return this.analyticsService.getBusinessSummary(user.id, days);
  }

  @Post('events')
  @ApiOperation({ summary: 'Log a generic analytics event' })
  @ApiResponse({ status: 201, description: 'The created event record', type: AnalyticsEvent })
  logEvent(
    @Body() logEventDto: LogEventDto,
    @CurrentUser() user: User,
  ): Promise<AnalyticsEvent> {
    return this.analyticsService.logEvent(logEventDto, user.id);
  }

  @Get('/posts/:id')
  @ApiOperation({ summary: "[DEPRECATED] Get analytics for a user's own post" })
  @ApiResponse({ status: 200, description: 'Post analytics data', type: PostAnalytic })
  async getPostAnalytics(
    @Param('id') postId: string,
    @CurrentUser() user: User,
  ): Promise<PostAnalytic> {
    const post = await this.postService.findOne(postId);
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You can only view analytics for your own posts.');
    }
    return this.analyticsService.findByPostId(postId);
  }
}
