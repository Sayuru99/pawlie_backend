import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSearchQueryDto {
  @ApiProperty({
    description: 'The search query string.',
    example: 'cute puppies',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  query: string;
}
