import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Notification>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      relations: ['from_user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    await this.notificationRepository.update(notificationId, { is_read: true });
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
    return { message: 'All notifications marked as read' };
  }

  // Helper methods for creating specific notification types
  async createLikeNotification(postOwnerId: string, likerId: string, postId: string): Promise<void> {
    if (postOwnerId === likerId) return; // Don't notify self

    await this.create({
      user_id: postOwnerId,
      from_user_id: likerId,
      type: NotificationType.LIKE,
      title: 'New Like',
      message: 'Someone liked your post',
      related_id: postId,
      related_type: 'post',
    });
  }

  async createFollowNotification(followedUserId: string, followerId: string): Promise<void> {
    await this.create({
      user_id: followedUserId,
      from_user_id: followerId,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      message: 'Someone started following you',
      related_id: followerId,
      related_type: 'user',
    });
  }

  async createMatchNotification(userId: string, petId: string): Promise<void> {
    await this.create({
      user_id: userId,
      type: NotificationType.MATCH,
      title: 'New Match',
      message: 'Your pet has a new match!',
      related_id: petId,
      related_type: 'pet',
    });
  }

  async createAdminWarningNotification(userId: string, message: string, adminId: string): Promise<void> {
    await this.create({
      user_id: userId,
      from_user_id: adminId,
      type: NotificationType.ADMIN_WARNING,
      title: 'Warning from Admin',
      message,
      related_type: 'admin',
    });
  }
}