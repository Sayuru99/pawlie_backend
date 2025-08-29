import { ApiProperty } from '@nestjs/swagger';

export class AdminAnalyticsDto {
  @ApiProperty({ description: 'Total number of users' })
  total_users: number;

  @ApiProperty({ description: 'Total number of pets' })
  total_pets: number;

  @ApiProperty({ description: 'Total number of posts' })
  total_posts: number;

  @ApiProperty({ description: 'Total number of active stories' })
  total_active_stories: number;

  @ApiProperty({ description: 'Total number of pending reports' })
  pending_reports: number;

  @ApiProperty({ description: 'New users this month' })
  new_users_this_month: number;

  @ApiProperty({ description: 'New posts this month' })
  new_posts_this_month: number;

  @ApiProperty({ description: 'Most reported content types' })
  most_reported_types: { type: string; count: number }[];

  @ApiProperty({ description: 'User engagement metrics' })
  engagement_metrics: {
    average_posts_per_user: number;
    average_followers_per_user: number;
    most_active_users: { username: string; post_count: number }[];
  };
}