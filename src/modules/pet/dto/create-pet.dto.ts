import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({ description: 'Pet name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Pet species' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  species: string;

  @ApiProperty({ description: 'Pet breed' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  breed: string;

  @ApiProperty({ description: 'Pet age' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  age: string;

  @ApiProperty({ description: 'Pet gender' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  gender: string;

  @ApiPropertyOptional({ description: 'Pet bio' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}