import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '../../../common/enums/visibility.enum';

export class CreatePostDto {
  @ApiProperty({ description: 'Post content' })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Pet ID to associate with post' })
  @IsOptional()
  @IsUUID()
  pet_id?: string;

  @ApiPropertyOptional({ description: 'Post visibility', enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility = Visibility.PUBLIC;
}