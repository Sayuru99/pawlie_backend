import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PostAnalytic } from './entities/post-analytic.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { Post } from '../post/entities/post.entity';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostAnalytic, AnalyticsEvent, Post]),
    PostModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
