import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class SwipeDto {
  @ApiProperty({ description: 'The ID of the pet performing the swipe' })
  @IsNotEmpty()
  @IsUUID()
  swiperPetId: string;

  @ApiProperty({ description: 'The ID of the pet being swiped on' })
  @IsNotEmpty()
  @IsUUID()
  targetPetId: string;

  @ApiProperty({ description: 'The direction of the swipe', enum: ['left', 'right'] })
  @IsNotEmpty()
  @IsIn(['left', 'right'])
  direction: 'left' | 'right';
}
