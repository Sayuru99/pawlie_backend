import { IsString, IsEnum, IsDateString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordType } from '../../../common/enums/record-type.enum';

export class CreateHealthRecordDto {
  @ApiProperty({ description: 'Pet ID' })
  @IsUUID()
  pet_id: string;

  @ApiProperty({ description: 'Record type', enum: RecordType })
  @IsEnum(RecordType)
  type: RecordType;

  @ApiProperty({ description: 'Record date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Record notes' })
  @IsString()
  @MaxLength(2000)
  notes: string;

  @ApiPropertyOptional({ description: 'Veterinarian name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  veterinarian?: string;
}