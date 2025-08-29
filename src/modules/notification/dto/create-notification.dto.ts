import { IsString, IsEnum, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID who receives the notification' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ description: 'User ID who triggered the notification' })
  @IsOptional()
  @IsUUID()
  from_user_id?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsUUID()
  related_id?: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  related_type?: string;
}