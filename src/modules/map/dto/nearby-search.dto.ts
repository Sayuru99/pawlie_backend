import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SearchType {
  PETS = 'pets',
  USERS = 'users',
  PROFESSIONALS = 'professionals',
}

export class NearbySearchDto {
  @ApiProperty({ description: 'Latitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Search radius in meters', default: 5000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  radius?: number = 5000;

  @ApiPropertyOptional({ description: 'Search type', enum: SearchType, default: SearchType.PETS })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.PETS;
}