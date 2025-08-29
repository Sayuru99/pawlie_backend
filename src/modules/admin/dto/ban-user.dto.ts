import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ description: 'Reason for banning the user' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Whether the ban is permanent' })
  @IsOptional()
  @IsBoolean()
  is_permanent?: boolean = false;

  @ApiPropertyOptional({ description: 'Ban duration in days (if not permanent)' })
  @IsOptional()
  ban_duration_days?: number;
}