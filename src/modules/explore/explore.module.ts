import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { Post } from '../post/entities/post.entity';
import { Pet } from '../pet/entities/pet.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Pet, User]),
    CacheModule.register({
      ttl: 600, // 10 minutes
    }),
  ],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [ExploreService],
})
export class ExploreModule {}