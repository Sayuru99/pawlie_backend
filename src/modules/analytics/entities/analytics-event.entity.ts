import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AnalyticsEventType {
  POST_VIEW = 'POST_VIEW',
  PROFILE_VIEW = 'PROFILE_VIEW',
  LIKE_POST = 'LIKE_POST',
  UNLIKE_POST = 'UNLIKE_POST',
  COMMENT_POST = 'COMMENT_POST',
  DELETE_COMMENT = 'DELETE_COMMENT',
  SHARE_POST = 'SHARE_POST',
  SEARCH = 'SEARCH',
}

@Entity('analytics_events')
@Index(['type', 'entity_id'])
export class AnalyticsEvent {
  @ApiProperty({ description: 'Event ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Type of the event', enum: AnalyticsEventType })
  @Column({ type: 'enum', enum: AnalyticsEventType })
  type: AnalyticsEventType;

  @ApiProperty({ description: 'ID of the user performing the action' })
  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ApiProperty({
    description: 'ID of the entity related to the event',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  entity_id?: string;

  @ApiProperty({
    description: 'Additional metadata for the event',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  @Index()
  created_at: Date;
}
