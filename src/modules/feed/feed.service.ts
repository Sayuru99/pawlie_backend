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
    const cacheKey = `feed:${userId}:${pagination.page}:${pagination.limit}`;
    
    // Try to get from cache first
    const cachedFeed = await this.cacheManager.get(cacheKey);
    if (cachedFeed) {
      return cachedFeed;
    }

    // Get user's followings
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['followings'],
    });

    const followingIds = user?.followings || [];
    const userIds = [userId, ...followingIds];

    // Get posts from followed users and own posts
    const posts = await this.getTimelinePosts(userIds, pagination);
    
    // Get active stories from followed users
    const stories = await this.getActiveStories(userIds);

    const feed = {
      posts,
      stories,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        hasMore: posts.length === pagination.limit,
      },
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, feed, 300); // 5 minutes

    return feed;
  }

  private async getTimelinePosts(userIds: string[], pagination: PaginationDto): Promise<Post[]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    if (userIds.length === 0) {
      return [];
    }

    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.pet', 'pet')
      .where('post.user_id IN (:...userIds)', { userIds })
      .andWhere('post.visibility IN (:...visibilities)', {
        visibilities: [Visibility.PUBLIC, Visibility.FOLLOWERS],
      })
      .orderBy('post.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();
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