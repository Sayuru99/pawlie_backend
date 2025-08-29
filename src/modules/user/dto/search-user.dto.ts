import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchUserDto extends PaginationDto {
  @ApiProperty({ description: 'Search query for username, first name, or last name', example: 'john' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q: string;
}