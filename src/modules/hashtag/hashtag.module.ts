import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hashtag } from './entities/hashtag.entity';
import { HashtagService } from './hashtag.service';
import { HashtagController } from './hashtag.controller';
import { PostHashtag } from '@/modules/post/entities/post-hashtag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hashtag, PostHashtag])],
  controllers: [HashtagController],
  providers: [HashtagService],
  exports: [HashtagService],
})
export class HashtagModule {}
