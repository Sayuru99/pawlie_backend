import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { Post } from '../post/entities/post.entity';
import { NotificationService } from '../notification/notification.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: createCommentDto.post_id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      user_id: userId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Increment post comment count and analytics
    await this.postRepository.increment({ id: createCommentDto.post_id }, 'comments_count', 1);
    await this.analyticsService.incrementComments(createCommentDto.post_id, userId);

    // Send notification to post owner
    if (post.user_id !== userId) {
      // This would be implemented in NotificationService
      // await this.notificationService.createCommentNotification(post.user_id, userId, post.id);
    }

    return savedComment;
  }

  async getPostComments(postId: string, pagination: PaginationDto): Promise<PaginatedResult<Comment>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post_id: postId, parent_id: null }, // Only top-level comments
      relations: ['user', 'replies', 'replies.user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(comment);
  }

  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    
    // Decrement post comment count and analytics
    await this.postRepository.decrement({ id: comment.post_id }, 'comments_count', 1);
    await this.analyticsService.decrementComments(comment.post_id, comment.user_id);
    
    await this.commentRepository.remove(comment);
  }
}