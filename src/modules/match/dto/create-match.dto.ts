import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty({ description: 'First pet ID' })
  @IsUUID()
  pet1_id: string;

  @ApiProperty({ description: 'Second pet ID' })
  @IsUUID()
  pet2_id: string;

  @ApiPropertyOptional({ description: 'Match message' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}