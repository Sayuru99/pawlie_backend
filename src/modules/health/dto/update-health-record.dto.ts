import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHealthRecordDto } from './create-health-record.dto';

export class UpdateHealthRecordDto extends PartialType(
  OmitType(CreateHealthRecordDto, ['pet_id'] as const)
) {}