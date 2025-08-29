import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateStoryDto } from './dto/create-story.dto';
import { Story } from './entities/story.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly storageService: StorageService,
  ) {}

  async create(createStoryDto: CreateStoryDto, userId: string, file: Express.Multer.File): Promise<Story> {
    const mediaUrl = await this.storageService.uploadFile(file, 'stories');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const story = this.storyRepository.create({
      ...createStoryDto,
      user_id: userId,
      media_url: mediaUrl,
      expires_at: expiresAt,
    });
    
    return this.storyRepository.save(story);
  }

  async findActiveStories(userId: string): Promise<Story[]> {
    const now = new Date();
    
    return this.storyRepository.find({
      where: {
        expires_at: MoreThan(now),
        // In a real implementation, you'd filter by followed users
      },
      relations: ['user', 'pet'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: ['user', 'pet'],
    });
    
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    
    return story;
  }

  async remove(id: string): Promise<void> {
    const result = await this.storyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Story not found');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStories(): Promise<void> {
    const now = new Date();
    await this.storyRepository.delete({
      expires_at: MoreThan(now),
    });
  }
}