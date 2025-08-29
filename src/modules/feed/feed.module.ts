import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from '../post/entities/post.entity';
import { Story } from '../story/entities/story.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Story, User]),
    CacheModule.register({
      ttl: 300, // 5 minutes
    }),
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}