import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { StorageService } from '../storage/storage.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Visibility } from '../../common/enums/visibility.enum';
import { AnalyticsService } from '../analytics/analytics.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { PostHashtag } from './entities/post-hashtag.entity';
import { Hashtag } from '../hashtag/entities/hashtag.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostHashtag)
    private readonly postHashtagRepository: Repository<PostHashtag>,
    private readonly storageService: StorageService,
    private readonly analyticsService: AnalyticsService,
    private readonly hashtagService: HashtagService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string, files?: Express.Multer.File[]): Promise<Post> {
    let mediaUrls: string[] = [];
    
    if (files && files.length > 0) {
      mediaUrls = await Promise.all(
        files.map(file => this.storageService.uploadFile(file, 'posts'))
      );
    }

    const postData = this.postRepository.create({
      ...createPostDto,
      user_id: userId,
      media_urls: mediaUrls,
    });
    
    const savedPost = await this.postRepository.save(postData);

    await this._handleHashtags(savedPost, createPostDto.content);

    // Create an analytics record for the new post
    await this.analyticsService.create(savedPost.id);

    return savedPost;
  }

  async findAll(pagination: PaginationDto): Promise<Post[]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    return this.postRepository.find({
      where: { visibility: Visibility.PUBLIC },
      relations: ['user', 'pet'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'pet', 'postHashtags', 'postHashtags.hashtag'],
    });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Increment view count
    await this.analyticsService.incrementViews(id);

    return post;
  }

  async sponsorPost(postId: string, userId: string): Promise<Post> {
    const post = await this.findOne(postId);

    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only sponsor your own posts.');
    }

    post.is_sponsored = true;
    // Set sponsorship to end in 7 days for this example
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    post.sponsorship_end_date = endDate;

    return this.postRepository.save(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const originalContent = post.content;

    Object.assign(post, updatePostDto);
    const updatedPost = await this.postRepository.save(post);

    if (updatePostDto.content && updatePostDto.content !== originalContent) {
      await this._handleHashtags(updatedPost, updatePostDto.content, originalContent);
    }

    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Decrement post counts for associated hashtags
    const hashtagIds = post.postHashtags.map(ph => ph.hashtag_id);
    if (hashtagIds.length > 0) {
      await this.dataSource.getRepository(Hashtag).decrement({ id: In(hashtagIds) }, 'post_count', 1);
    }

    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
    }
  }

  private async _handleHashtags(post: Post, newContent: string, oldContent?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newHashtags = await this.hashtagService.processHashtagsFromText(newContent);
      const oldHashtags = oldContent ? await this.hashtagService.processHashtagsFromText(oldContent) : [];

      const newHashtagIds = newHashtags.map(h => h.id);
      const oldHashtagIds = oldHashtags.map(h => h.id);

      const hashtagsToAdd = newHashtags.filter(h => !oldHashtagIds.includes(h.id));
      const hashtagsToRemove = oldHashtags.filter(h => !newHashtagIds.includes(h.id));

      if (hashtagsToAdd.length > 0) {
        const newPostHashtags = hashtagsToAdd.map(h =>
          this.postHashtagRepository.create({ post_id: post.id, hashtag_id: h.id })
        );
        await queryRunner.manager.save(PostHashtag, newPostHashtags);
        await queryRunner.manager.increment(Hashtag, { id: In(hashtagsToAdd.map(h => h.id)) }, 'post_count', 1);
      }

      if (hashtagsToRemove.length > 0) {
        const hashtagIdsToRemove = hashtagsToRemove.map(h => h.id);
        await queryRunner.manager.delete(PostHashtag, { post_id: post.id, hashtag_id: In(hashtagIdsToRemove) });
        await queryRunner.manager.decrement(Hashtag, { id: In(hashtagIdsToRemove) }, 'post_count', 1);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likes_count: number }> {
    const post = await this.findOne(postId);
    
    // In a real implementation, you'd have a separate likes table
    // For now, we'll just increment/decrement the counter
    const liked = Math.random() > 0.5; // Simulate toggle
    
    if (liked) {
      post.likes_count += 1;
    } else {
      post.likes_count = Math.max(0, post.likes_count - 1);
    }
    
    await this.postRepository.save(post);
    
    return { liked, likes_count: post.likes_count };
  }
}