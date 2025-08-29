import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '../../../common/enums/report-status.enum';

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Report status', enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Admin review notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review_notes?: string;
}