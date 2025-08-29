import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PostAnalytic } from './entities/post-analytic.entity';
import { AnalyticsEvent, AnalyticsEventType } from './entities/analytics-event.entity';
import { LogEventDto } from './dto/log-event.dto';
import { BusinessAnalyticsSummaryDto, TopPostDto, ProfileStatsDto } from './dto/business-analytics.dto';
import { Post } from '../post/entities/post.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PostAnalytic)
    private readonly postAnalyticsRepository: Repository<PostAnalytic>,
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * Logs a generic analytics event. This is the primary method for all new event tracking.
   */
  async logEvent(dto: LogEventDto, userId: string): Promise<AnalyticsEvent> {
    const event = this.eventRepository.create({
      type: dto.type,
      user_id: userId,
      entity_id: dto.entityId,
      metadata: dto.metadata,
    });
    return this.eventRepository.save(event);
  }

  async getBusinessSummary(userId: string, days = 30): Promise<BusinessAnalyticsSummaryDto> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const profileStats = await this.getProfileStats(userId, since);
    const topPosts = await this.getTopPosts(userId, since, 5);

    return {
      profile_stats: profileStats,
      top_posts: topPosts,
    };
  }

  private async getProfileStats(userId: string, since: Date): Promise<ProfileStatsDto> {
    const profileViewsQuery = this.eventRepository.count({
      where: {
        type: AnalyticsEventType.PROFILE_VIEW,
        entity_id: userId,
        created_at: Between(since, new Date()),
      },
    });

    // NOTE: Follower tracking isn't implemented as an event yet.
    // This is a placeholder for when `USER_FOLLOW` events are logged.
    const newFollowersQuery = Promise.resolve(0);

    const userPosts = await this.postRepository.find({ where: { user_id: userId }, select: ['id'] });
    const postIds = userPosts.map(p => p.id);

    let totalEngagement = 0;
    if (postIds.length > 0) {
      totalEngagement = await this.eventRepository.count({
        where: [
          { entity_id: In(postIds), type: AnalyticsEventType.LIKE_POST, created_at: Between(since, new Date()) },
          { entity_id: In(postIds), type: AnalyticsEventType.COMMENT_POST, created_at: Between(since, new Date()) },
        ],
      });
    }

    const [profile_views, new_followers] = await Promise.all([profileViewsQuery, newFollowersQuery]);

    return {
      profile_views,
      new_followers,
      total_engagement: totalEngagement,
    };
  }

  private async getTopPosts(userId: string, since: Date, limit: number): Promise<TopPostDto[]> {
    const userPosts = await this.postRepository.find({ where: { user_id: userId }, select: ['id'] });
    if (userPosts.length === 0) return [];

    const postIds = userPosts.map(p => p.id);

    const engagementQuery = this.eventRepository
      .createQueryBuilder('event')
      .select('event.entity_id', 'postId')
      .addSelect("COUNT(CASE WHEN event.type = 'LIKE_POST' THEN 1 END)", 'likes')
      .addSelect("COUNT(CASE WHEN event.type = 'COMMENT_POST' THEN 1 END)", 'comments')
      .where('event.entity_id IN (:...postIds)', { postIds })
      .andWhere('event.created_at >= :since', { since })
      .andWhere("event.type IN ('LIKE_POST', 'COMMENT_POST')")
      .groupBy('event.entity_id')
      .orderBy("COUNT(CASE WHEN event.type = 'LIKE_POST' THEN 1 END) + COUNT(CASE WHEN event.type = 'COMMENT_POST' THEN 1 END)", 'DESC')
      .limit(limit)
      .getRawMany();

    const viewsQuery = this.eventRepository
      .createQueryBuilder('event')
      .select('event.entity_id', 'postId')
      .addSelect('COUNT(*)', 'views')
      .where('event.entity_id IN (:...postIds)', { postIds })
      .andWhere('event.created_at >= :since', { since })
      .andWhere("event.type = 'POST_VIEW'")
      .groupBy('event.entity_id')
      .getRawMany();

    const [engagementResults, viewsResults] = await Promise.all([engagementQuery, viewsQuery]);

    const viewsMap = new Map<string, number>(viewsResults.map(v => [v.postId, parseInt(v.views, 10)]));

    const topPostDetails = await this.postRepository.find({
        where: { id: In(engagementResults.map(p => p.postId)) },
        select: ['id', 'content'],
    });

    const topPostDto = engagementResults.map(post => {
      const details = topPostDetails.find(p => p.id === post.postId);
      const likes = parseInt(post.likes, 10);
      const comments = parseInt(post.comments, 10);
      return {
        postId: post.postId,
        content: details ? details.content.substring(0, 100) : '',
        views: viewsMap.get(post.postId) || 0,
        likes: likes,
        comments: comments,
        engagement: likes + comments,
      };
    });

    return topPostDto;
  }

  // --- Legacy Post-specific methods ---
  // These methods are kept for backward compatibility but should be phased out.
  // They now use the new generic event logging system internally.

  /**
   * @deprecated Use logEvent({ type: AnalyticsEventType.POST_VIEW, ... }) instead.
   */
  async incrementViews(postId: string, userId: string): Promise<void> {
    // This is a simplified implementation. A robust system might also update a counter
    // on the PostAnalytic entity or a Redis cache for real-time counts.
    await this.logEvent({ type: AnalyticsEventType.POST_VIEW, entityId: postId }, userId);
  }

  /**
   * @deprecated Use logEvent({ type: AnalyticsEventType.LIKE_POST, ... }) instead.
   */
  async incrementLikes(postId: string, userId: string): Promise<void> {
    await this.logEvent({ type: AnalyticsEventType.LIKE_POST, entityId: postId }, userId);
  }

  /**
   * @deprecated Use logEvent({ type: AnalyticsEventType.UNLIKE_POST, ... }) instead.
   */
  async decrementLikes(postId: string, userId: string): Promise<void> {
    await this.logEvent({ type: AnalyticsEventType.UNLIKE_POST, entityId: postId }, userId);
  }

  /**
   * @deprecated Use logEvent({ type: AnalyticsEventType.COMMENT_POST, ... }) instead.
   */
  async incrementComments(postId: string, userId: string): Promise<void> {
    await this.logEvent({ type: AnalyticsEventType.COMMENT_POST, entityId: postId }, userId);
  }

  /**
   * @deprecated Use logEvent({ type: AnalyticsEventType.DELETE_COMMENT, ... }) instead.
   */
  async decrementComments(postId: string, userId: string): Promise<void> {
    await this.logEvent({ type: AnalyticsEventType.DELETE_COMMENT, entityId: postId }, userId);
  }

  /**
   * @deprecated This method is for demonstration. The logic should be handled by the PostService.
   */
  async findByPostId(postId: string): Promise<PostAnalytic> {
    return this.postAnalyticsRepository.findOne({ where: { post_id: postId } });
  }

  /**
   * @deprecated The concept of creating a separate analytic record is replaced by event sourcing.
   */
  async create(postId: string): Promise<PostAnalytic> {
    const existing = await this.findByPostId(postId);
    if (existing) {
      return existing;
    }
    const newAnalytic = this.postAnalyticsRepository.create({ post_id: postId });
    return this.postAnalyticsRepository.save(newAnalytic);
  }
}
