import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-yet';


import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PetModule } from './modules/pet/pet.module';
import { PostModule } from './modules/post/post.module';
import { StoryModule } from './modules/story/story.module';
import { HealthModule } from './modules/health/health.module';
import { MatchModule } from './modules/match/match.module';
import { MapModule } from './modules/map/map.module';
import { ReviewModule } from './modules/review/review.module';
import { FeedModule } from './modules/feed/feed.module';
import { ExploreModule } from './modules/explore/explore.module';
import { ReportModule } from './modules/report/report.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { LikeModule } from './modules/like/like.module';
import { CommentModule } from './modules/comment/comment.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ChatModule } from './modules/chat/chat.module';
import { HashtagModule } from './modules/hashtag/hashtag.module';
import { SearchModule } from './modules/search/search.module';


import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtBlocklistGuard } from './common/guards/jwt-blocklist.guard';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    
    DatabaseModule,

    
CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        ttl: 300000, 
      }),
      inject: [ConfigService],
    }),

    
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60,
          limit: configService.get('THROTTLE_LIMIT') || 100,
        },
      ],
      inject: [ConfigService],
    }),

    
    ScheduleModule.forRoot(),

    
    AuthModule,
    UserModule,
    PetModule,
    PostModule,
    StoryModule,
    HealthModule,
    MatchModule,
    MapModule,
    ReviewModule,
    FeedModule,
    ExploreModule,
    ReportModule,
    AdminModule,
    NotificationModule,
    PaymentModule,
    LikeModule,
    CommentModule,
    EmailModule,
    StorageModule,
    AnalyticsModule,
    ChatModule,
    HashtagModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtBlocklistGuard,
    },
  ],
})
export class AppModule {}