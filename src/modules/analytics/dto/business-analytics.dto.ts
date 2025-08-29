import { ApiProperty } from '@nestjs/swagger';

export class ProfileStatsDto {
  @ApiProperty({ description: 'Total profile views in the period.' })
  profile_views: number;

  @ApiProperty({ description: 'Total new followers in the period.' })
  new_followers: number;

  @ApiProperty({ description: 'Total engagement events (likes, comments) on all content.' })
  total_engagement: number;
}

export class TopPostDto {
  @ApiProperty({ description: 'The ID of the post.' })
  postId: string;

  @ApiProperty({ description: 'The content snippet of the post.' })
  content: string;

  @ApiProperty({ description: 'Total views for this post.' })
  views: number;

  @ApiProperty({ description: 'Total likes for this post.' })
  likes: number;

  @ApiProperty({ description: 'Total comments for this post.' })
  comments: number;

  @ApiProperty({ description: 'Total engagement for this post (likes + comments).' })
  engagement: number;
}

export class BusinessAnalyticsSummaryDto {
  @ApiProperty({ description: 'Summary of profile statistics.' })
  profile_stats: ProfileStatsDto;

  @ApiProperty({ description: 'List of top performing posts.', type: [TopPostDto] })
  top_posts: TopPostDto[];
}
