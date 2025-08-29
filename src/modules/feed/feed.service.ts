import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Post } from '../post/entities/post.entity';
import { Story } from '../story/entities/story.entity';
import { User } from '../user/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Visibility } from '../../common/enums/visibility.enum';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getPersonalizedFeed(userId: string, pagination: PaginationDto) {
    // Caching is disabled for algorithmic feed for now to ensure freshness
    // In a real-world scenario, a more sophisticated caching strategy would be needed.

    // Get user's followings
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['followings'],
    });

    const followingIds = user?.followings?.map(f => f.followee_id) || [];
    const userIds = [userId, ...followingIds];

    // 1. Get recent posts from followed users and own posts (unsorted)
    const recentPosts = await this.getTimelinePosts(userIds);

    // 2. Calculate score for each post
    const scoredPosts = recentPosts.map(post => ({
      post,
      score: this.calculatePostScore(post),
    }));

    // 3. Sort posts by score
    scoredPosts.sort((a, b) => b.score - a.score);
    let sortedPosts = scoredPosts.map(item => item.post);

    // 4. Inject a sponsored post on the first page
    if (pagination.page === 1) {
      const sponsoredPost = await this.getSponsoredPost(userIds);
      if (sponsoredPost) {
        // Inject at a specific position, e.g., 3rd item
        sortedPosts.splice(2, 0, sponsoredPost);
      }
    }
    
    // 5. Apply pagination to the sorted list
    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = sortedPosts.slice(startIndex, startIndex + limit);

    // Get active stories from followed users
    const stories = await this.getActiveStories(userIds);

    const feed = {
      posts: paginatedPosts,
      stories,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: sortedPosts.length,
        hasMore: startIndex + limit < sortedPosts.length,
      },
    };

    return feed;
  }

  private async getTimelinePosts(userIds: string[]): Promise<Post[]> {
    if (userIds.length === 0) {
      return [];
    }

    // Fetch posts from the last 7 days to keep the pool of posts to be sorted manageable
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.pet', 'pet')
      .where('post.user_id IN (:...userIds)', { userIds })
      .andWhere('post.visibility IN (:...visibilities)', {
        visibilities: [Visibility.PUBLIC, Visibility.FOLLOWERS],
      })
      .andWhere('post.created_at > :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('post.created_at', 'DESC') // Still order by date to get the most recent ones
      .take(200) // Take a larger pool of posts for in-memory sorting
      .getMany();
  }

  private calculatePostScore(post: Post): number {
    const recencyWeight = 1.0;
    const engagementWeight = 0.5;
    const gravity = 1.8;

    // Recency score (the older the post, the lower the score)
    const ageInHours = (new Date().getTime() - new Date(post.created_at).getTime()) / 3600000;
    const recencyScore = recencyWeight / Math.pow(ageInHours + 2, gravity);

    // Engagement score
    const engagementScore = engagementWeight * (post.likes_count + post.comments_count);

    return recencyScore + engagementScore;
  }

  private async getSponsoredPost(excludeUserIds: string[]): Promise<Post | null> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find one random active sponsored post not from the user or their followings
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.is_sponsored = :isSponsored', { isSponsored: true })
      .andWhere('post.sponsorship_end_date > :now', { now: new Date() })
      .andWhere('post.user_id NOT IN (:...excludeUserIds)', { excludeUserIds })
      .orderBy('RANDOM()') // Note: RANDOM() can be slow on large datasets. Use with caution.
      .getOne();
  }

  private async getActiveStories(userIds: string[]): Promise<Story[]> {
    if (userIds.length === 0) {
      return [];
    }

    const now = new Date();
    
    return this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.pet', 'pet')
      .where('story.user_id IN (:...userIds)', { userIds })
      .andWhere('story.expires_at > :now', { now })
      .orderBy('story.created_at', 'DESC')
      .limit(20)
      .getMany();
  }

  async invalidateUserFeedCache(userId: string): Promise<void> {
    const keys = await this.cacheManager.store.keys(`feed:${userId}:*`);
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}