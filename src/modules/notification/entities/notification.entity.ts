import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MATCH = 'match',
  STORY_VIEW = 'story_view',
  ADMIN_WARNING = 'admin_warning',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'Notification ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who receives the notification' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'User ID who triggered the notification (nullable for system notifications)' })
  @Column({ type: 'uuid', nullable: true })
  from_user_id?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Related entity ID (post, pet, etc.)' })
  @Column({ type: 'uuid', nullable: true })
  related_id?: string;

  @ApiProperty({ description: 'Related entity type' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  related_type?: string;

  @ApiProperty({ description: 'Whether notification has been read' })
  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @ApiProperty({ description: 'Whether notification was sent via push' })
  @Column({ type: 'boolean', default: false })
  is_push_sent: boolean;

  @ApiProperty({ description: 'Whether notification was sent via email' })
  @Column({ type: 'boolean', default: false })
  is_email_sent: boolean;

  @ApiProperty({ description: 'User who receives notification', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'User who triggered notification', type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'from_user_id' })
  from_user?: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;
}