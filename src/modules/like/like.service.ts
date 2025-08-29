import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../post/entities/post.entity';
import { NotificationService } from '../notification/notification.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async toggleLike(postId: string, userId: string): Promise<{ message: string; liked: boolean }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      await this.postRepository.decrement({ id: postId }, 'likes_count', 1);
      await this.analyticsService.decrementLikes(postId);
      return { message: 'Post unliked successfully', liked: false };
    } else {
      // Like
      const like = this.likeRepository.create({
        post_id: postId,
        user_id: userId,
      });
      await this.likeRepository.save(like);
      await this.postRepository.increment({ id: postId }, 'likes_count', 1);
      await this.analyticsService.incrementLikes(postId);

      // Send notification to post owner
      if (post.user_id !== userId) {
        await this.notificationService.createLikeNotification(post.user_id, userId, postId);
      }

      return { message: 'Post liked successfully', liked: true };
    }
  }

  async getPostLikes(postId: string): Promise<Like[]> {
    return this.likeRepository.find({
      where: { post_id: postId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    return !!like;
  }
}