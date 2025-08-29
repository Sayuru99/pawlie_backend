import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BanUserDto } from './dto/ban-user.dto';
import { AdminAnalyticsDto } from './dto/admin-analytics.dto';
import { UpdateReportDto } from '../report/dto/update-report.dto';
import { Admin } from './entities/admin.entity';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';
import { Pet } from '../pet/entities/pet.entity';
import { Story } from '../story/entities/story.entity';
import { Report } from '../report/entities/report.entity';
import { Comment } from '../comment/entities/comment.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ReportStatus } from '../../common/enums/report-status.enum';
import { ReportType } from '../report/entities/report.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    const [
      totalUsers,
      totalPets,
      totalPosts,
      totalActiveStories,
      pendingReports,
      newUsersThisMonth,
      newPostsThisMonth,
    ] = await Promise.all([
      this.userRepository.count(),
      this.petRepository.count(),
      this.postRepository.count(),
      this.storyRepository.count({ where: { expires_at: new Date() } }),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.getUsersThisMonth(),
      this.getPostsThisMonth(),
    ]);

    const mostReportedTypes = await this.getMostReportedTypes();
    const engagementMetrics = await this.getEngagementMetrics();

    return {
      total_users: totalUsers,
      total_pets: totalPets,
      total_posts: totalPosts,
      total_active_stories: totalActiveStories,
      pending_reports: pendingReports,
      new_users_this_month: newUsersThisMonth,
      new_posts_this_month: newPostsThisMonth,
      most_reported_types: mostReportedTypes,
      engagement_metrics: engagementMetrics,
    };
  }

  async getAllUsers(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'first_name', 'last_name', 'username', 'email', 'user_type', 'is_verified', 'created_at'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async banUser(userId: string, banUserDto: BanUserDto, adminId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate ban expiry date
    let banExpiresAt: Date | null = null;
    if (!banUserDto.is_permanent && banUserDto.ban_duration_days) {
      banExpiresAt = new Date();
      banExpiresAt.setDate(banExpiresAt.getDate() + banUserDto.ban_duration_days);
    }

    // Update user with ban information
    await this.userRepository.update(userId, {
      is_banned: true,
      ban_reason: banUserDto.reason,
      ban_expires_at: banExpiresAt,
      banned_by: adminId,
      banned_at: new Date(),
    });

    return { message: 'User banned successfully' };
  }

  async unbanUser(userId: string, adminId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, {
      is_banned: false,
      ban_reason: null,
      ban_expires_at: null,
      banned_by: null,
      banned_at: null,
    });

    return { message: 'User unbanned successfully' };
  }

  async verifyUser(userId: string, is_verified: boolean): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_verified = is_verified;
    // Optionally, clear verification expiry if setting to false
    if (!is_verified) {
      user.verification_expires_at = null;
    }

    return this.userRepository.save(user);
  }

  async deletePost(postId: string, adminId: string): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postRepository.delete(postId);
    return { message: 'Post deleted successfully' };
  }

  async deleteStory(storyId: string, adminId: string): Promise<{ message: string }> {
    const story = await this.storyRepository.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    await this.storyRepository.delete(storyId);
    return { message: 'Story deleted successfully' };
  }

  async deleteComment(commentId: string, adminId: string): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentRepository.delete(commentId);
    return { message: 'Comment deleted successfully' };
  }

  async getReports(pagination: PaginationDto, status?: string): Promise<PaginatedResult<Report>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await this.reportRepository.findAndCount({
      where,
      relations: ['reporter', 'reviewer'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async updateReport(reportId: string, updateReportDto: UpdateReportDto, adminId: string) {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    Object.assign(report, {
      ...updateReportDto,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    const savedReport = await this.reportRepository.save(report);

    // If action is taken, perform the action
    if (savedReport.status === ReportStatus.ACTION_TAKEN) {
      switch (report.target_type) {
        case ReportType.POST:
          await this.deletePost(report.target_id, adminId);
          break;
        case ReportType.COMMENT:
          await this.deleteComment(report.target_id, adminId);
          break;
        // case ReportType.STORY: // Assuming Story is a reportable type
        //   await this.deleteStory(report.target_id, adminId);
        //   break;
        case ReportType.USER:
          await this.banUser(report.target_id, { reason: `Banned due to report #${report.id}` }, adminId);
          break;
        default:
          break;
      }
    }

    return savedReport;
  }

  async notifyUser(userId: string, message: string, adminId: string): Promise<{ message: string }> {
    // This would integrate with NotificationService
    // For now, just return success message
    return { message: 'Notification sent successfully' };
  }

  async getAllPosts(pagination: PaginationDto): Promise<PaginatedResult<Post>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['user', 'pet'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 };
  }

  async getAllStories(pagination: PaginationDto): Promise<PaginatedResult<Story>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [stories, total] = await this.storyRepository.findAndCount({
      relations: ['user', 'pet'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data: stories, total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 };
  }

  async getAllComments(pagination: PaginationDto): Promise<PaginatedResult<Comment>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      relations: ['user', 'post'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data: comments, total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 };
  }

  private async getUsersThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.userRepository.count({
      where: {
        created_at: MoreThan(startOfMonth),
      },
    });
  }

  private async getPostsThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.postRepository.count({
      where: {
        created_at: MoreThan(startOfMonth),
      },
    });
  }

  private async getMostReportedTypes(): Promise<{ type: string; count: number }[]> {
    const result = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.target_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.target_type')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map(item => ({
      type: item.type,
      count: parseInt(item.count),
    }));
  }

  private async getEngagementMetrics() {
    const avgPostsPerUser = await this.postRepository
      .createQueryBuilder('post')
      .select('COUNT(*) / COUNT(DISTINCT post.user_id)', 'avg')
      .getRawOne();

    const avgFollowersPerUser = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.followers_count)', 'avg')
      .getRawOne();

    const mostActiveUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.posts', 'post')
      .select(['user.username', 'COUNT(post.id) as post_count'])
      .groupBy('user.id')
      .orderBy('post_count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      average_posts_per_user: parseFloat(avgPostsPerUser.avg) || 0,
      average_followers_per_user: parseFloat(avgFollowersPerUser.avg) || 0,
      most_active_users: mostActiveUsers.map(user => ({
        username: user.username,
        post_count: parseInt(user.post_count),
      })),
    };
  }
}