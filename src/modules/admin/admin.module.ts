import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ReportModule } from '../report/report.module';
import { NotificationModule } from '../notification/notification.module';
import { Post } from '../post/entities/post.entity';
import { Pet } from '../pet/entities/pet.entity';
import { Story } from '../story/entities/story.entity';
import { Report } from '../report/entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, Post, Pet, Story, Report]),
    UserModule,
    PostModule,
    ReportModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}