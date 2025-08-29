import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { StorageService } from '../storage/storage.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Visibility } from '../../common/enums/visibility.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly storageService: StorageService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string, files?: Express.Multer.File[]): Promise<Post> {
    let mediaUrls: string[] = [];
    
    if (files && files.length > 0) {
      mediaUrls = await Promise.all(
        files.map(file => this.storageService.uploadFile(file, 'posts'))
      );
    }

    const post = this.postRepository.create({
      ...createPostDto,
      user_id: userId,
      media_urls: mediaUrls,
    });
    
    return this.postRepository.save(post);
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
      relations: ['user', 'pet'],
    });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
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