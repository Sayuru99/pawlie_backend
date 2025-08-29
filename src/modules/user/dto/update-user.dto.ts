import { IsString, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '../../../common/enums/visibility.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ description: 'User bio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'Profile visibility', enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({ description: 'Business details for professional users' })
  @IsOptional()
  business_details?: {
    name?: string;
    services?: string[];
    hours?: string;
    category?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  @ApiPropertyOptional({ description: 'User preferences' })
  @IsOptional()
  preferences?: {
    preferred_breeds?: string[];
    services?: string[];
    age_range?: string;
  };

  @ApiPropertyOptional({ description: 'Notification preferences' })
  @IsOptional()
  notification_preferences?: {
    follow?: boolean;
    like?: boolean;
    comment?: boolean;
    story?: boolean;
    event_rsvp?: boolean;
  };
}