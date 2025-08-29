import { IsString, IsEnum, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportCategory } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'ID of the content being reported' })
  @IsUUID()
  target_id: string;

  @ApiProperty({ description: 'Type of content being reported', enum: ReportType })
  @IsEnum(ReportType)
  target_type: ReportType;

  @ApiProperty({ description: 'Report category', enum: ReportCategory })
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @ApiPropertyOptional({ description: 'Additional details about the report' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}