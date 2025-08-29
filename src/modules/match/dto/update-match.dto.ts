import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../../../common/enums/match-status.enum';

export class UpdateMatchDto {
  @ApiProperty({ description: 'Match status', enum: MatchStatus })
  @IsEnum(MatchStatus)
  status: MatchStatus;
}