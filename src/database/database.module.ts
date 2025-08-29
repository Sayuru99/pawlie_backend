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

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
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
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}