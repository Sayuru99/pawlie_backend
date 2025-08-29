import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../../common/enums/user-type.enum';

export class RegisterDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @MinLength(2)
  first_name: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @MinLength(2)
  last_name: string;

  @ApiProperty({ description: 'Unique username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'User type', enum: UserType, default: UserType.NORMAL })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType = UserType.NORMAL;
}