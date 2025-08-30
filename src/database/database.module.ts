import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/user/entities/user.entity';
import { Pet } from '../modules/pet/entities/pet.entity';
import { Post } from '../modules/post/entities/post.entity';
import { Story } from '../modules/story/entities/story.entity';
import { HealthRecord } from '../modules/health/entities/health-record.entity';
import { Match } from '../modules/match/entities/match.entity';
import { Review } from '../modules/review/entities/review.entity';
import { Report } from '../modules/report/entities/report.entity';
import { Notification } from '../modules/notification/entities/notification.entity';
import { Admin } from '../modules/admin/entities/admin.entity';
import { Payment } from '../modules/payment/entities/payment.entity';
import { Like } from '../modules/like/entities/like.entity';
import { Comment } from '../modules/comment/entities/comment.entity';
import { PostHashtag } from '../modules/post/entities/post-hashtag.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        username: configService.get<string>('ORACLE_USER'),
        password: configService.get<string>('ORACLE_PASSWORD'),
        connectString: configService.get<string>('ORACLE_CONNECT_STRING'),
        entities: [
          User,
          Pet,
          Post,
          Story,
          HealthRecord,
          Match,
          Review,
          Report,
          Notification,
          Admin,
          Payment,
          Like,
          Comment,
          PostHashtag,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}