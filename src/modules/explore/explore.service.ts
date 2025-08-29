import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Post } from '../post/entities/post.entity';
import { Pet } from '../pet/entities/pet.entity';
import { User } from '../user/entities/user.entity';
import { Like } from '../like/entities/like.entity';
import { Comment } from '../comment/entities/comment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Visibility } from '../../common/enums/visibility.enum';
import { UserType } from '../../common/enums/user-type.enum';

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getExploreContent(userId: string, pagination: PaginationDto) {
    // Caching is disabled for now to ensure personalization is fresh
    // const cacheKey = `explore:${userId}:${pagination.page}:${pagination.limit}`;
    
    // const cachedContent = await this.cacheManager.get(cacheKey);
    // if (cachedContent) {
    //   return cachedContent;
    // }

    const [trendingPosts, recommendedPets, recommendedUsers] = await Promise.all([
      this.getTrendingPosts(userId, pagination),
      this.getRecommendedPets(userId, { page: 1, limit: 10 }),
      this.getRecommendedUsers(userId, { page: 1, limit: 10 }),
    ]);

    const content = {
      trending_posts: trendingPosts,
      recommended_pets: recommendedPets,
      recommended_users: recommendedUsers,
    };

    await this.cacheManager.set(cacheKey, content, 600); // 10 minutes
    return content;
  }

  async getTrendingPosts(userId: string, pagination: PaginationDto): Promise<Post[]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    
    const user = await this.userRepository.findOne({ where: { id: userId }, select: ['blocked_users'] });
    const blockedUserIds = user?.blocked_users || [];

    // Find posts the user has already interacted with
    const userLikes = await this.likeRepository.find({ where: { user_id: userId }, select: ['post_id'] });
    const userComments = await this.commentRepository.find({ where: { user_id: userId }, select: ['post_id'] });
    const interactedPostIds = [...new Set([...userLikes.map(l => l.post_id), ...userComments.map(c => c.post_id)])];

    // Get posts from the last 7 days with high engagement
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.pet', 'pet')
      .where('post.created_at > :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('post.visibility = :visibility', { visibility: Visibility.PUBLIC });

    if (blockedUserIds.length > 0) {
      query.andWhere('post.user_id NOT IN (:...blockedUserIds)', { blockedUserIds });
    }

    if (interactedPostIds.length > 0) {
      query.andWhere('post.id NOT IN (:...interactedPostIds)', { interactedPostIds });
    }

    return query
      .orderBy('(post.likes_count * 0.6 + post.comments_count * 0.4)', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();
  }

  async getRecommendations(userId: string, pagination: PaginationDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['preferences', 'location'],
    });

    const [pets, users] = await Promise.all([
      this.getRecommendedPets(userId, pagination, user),
      this.getRecommendedUsers(userId, pagination, user),
    ]);

    return { pets, users };
  }

  private async getRecommendedPets(userId: string, pagination: PaginationDto, user?: User): Promise<Pet[]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    let query = this.petRepository
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .where('pet.user_id != :userId', { userId });

    // If user has preferences, filter by breed
    if (user?.preferences?.['preferred_breeds']) {
      const preferredBreeds = user.preferences['preferred_breeds'] as string[];
      query = query.andWhere('pet.breed IN (:...breeds)', { breeds: preferredBreeds });
    }

    // If user has location, prioritize nearby pets
    if (user?.location) {
      query = query
        .addSelect('ST_Distance(pet.location, :userLocation) as distance')
        .setParameter('userLocation', user.location)
        .orderBy('distance', 'ASC');
    } else {
      query = query.orderBy('pet.created_at', 'DESC');
    }

    return query
      .skip(skip)
      .take(limit)
      .getMany();
  }

  private async getRecommendedUsers(userId: string, pagination: PaginationDto, user?: User): Promise<User[]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    let query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
        'user.user_type',
        'user.business_details',
      ]);

    // Prioritize professional users if user has service preferences
    if (user?.preferences?.['services']) {
      query = query
        .andWhere('user.user_type = :userType', { userType: UserType.PROFESSIONAL })
        .andWhere('user.business_details IS NOT NULL');
    }

    // If user has location, prioritize nearby users
    if (user?.location) {
      query = query
        .addSelect('ST_Distance(user.location, :userLocation) as distance')
        .setParameter('userLocation', user.location)
        .orderBy('distance', 'ASC');
    } else {
      query = query.orderBy('user.created_at', 'DESC');
    }

    return query
      .skip(skip)
      .take(limit)
      .getMany();
  }
}