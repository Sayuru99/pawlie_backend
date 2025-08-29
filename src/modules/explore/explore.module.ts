import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { Post } from '../post/entities/post.entity';
import { Pet } from '../pet/entities/pet.entity';
import { User } from '../user/entities/user.entity';
import { Like } from '../like/entities/like.entity';
import { Comment } from '../comment/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Pet, User, Like, Comment]),
    CacheModule.register({
      ttl: 600, // 10 minutes
    }),
  ],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [ExploreService],
})
export class ExploreModule {}