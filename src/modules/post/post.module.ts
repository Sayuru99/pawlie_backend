import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { StorageModule } from '../storage/storage.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { HashtagModule } from '../hashtag/hashtag.module';
import { PostHashtag } from './entities/post-hashtag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostHashtag]),
    StorageModule,
    forwardRef(() => AnalyticsModule),
    HashtagModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}