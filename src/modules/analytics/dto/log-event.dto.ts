import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
import { AnalyticsEventType } from '../entities/analytics-event.entity';

export class LogEventDto {
  @ApiProperty({
    description: 'The type of the analytics event.',
    enum: AnalyticsEventType,
    example: AnalyticsEventType.POST_VIEW,
  })
  @IsEnum(AnalyticsEventType)
  type: AnalyticsEventType;

  @ApiProperty({
    description: 'The ID of the entity associated with the event (e.g., Post ID, User ID).',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'A JSON object for additional, unstructured data about the event.',
    required: false,
    example: { duration: '30s', source: 'explore_page' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
