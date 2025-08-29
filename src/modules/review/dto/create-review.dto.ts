import { IsString, IsInt, IsUUID, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'User ID to review' })
  @IsUUID()
  reviewed_user_id: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @MaxLength(1000)
  comment: string;
}