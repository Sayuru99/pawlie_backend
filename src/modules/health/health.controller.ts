import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { HealthRecord } from './entities/health-record.entity';

@ApiTags('Health Records')
@Controller('health')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post()
  @ApiOperation({ summary: 'Create a health record' })
  @ApiResponse({ status: 201, description: 'Health record created successfully', type: HealthRecord })
  async create(
    @Body() createHealthRecordDto: CreateHealthRecordDto,
    @CurrentUser() user: User,
  ): Promise<HealthRecord> {
    return this.healthService.create(createHealthRecordDto, user.id);
  }

  @Get(':petId')
  @ApiOperation({ summary: 'Get health records for a pet' })
  @ApiResponse({ status: 200, description: 'List of health records', type: [HealthRecord] })
  async findByPet(@Param('petId') petId: string, @CurrentUser() user: User): Promise<HealthRecord[]> {
    return this.healthService.findByPet(petId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a health record' })
  @ApiResponse({ status: 200, description: 'Health record updated successfully', type: HealthRecord })
  async update(
    @Param('id') id: string,
    @Body() updateHealthRecordDto: UpdateHealthRecordDto,
    @CurrentUser() user: User,
  ): Promise<HealthRecord> {
    const record = await this.healthService.findOne(id);
    const canUpdate = await this.healthService.canUserAccessRecord(record.pet_id, user.id);
    
    if (!canUpdate) {
      throw new ForbiddenException('You can only update health records for your own pets');
    }
    
    return this.healthService.update(id, updateHealthRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a health record' })
  @ApiResponse({ status: 200, description: 'Health record deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const record = await this.healthService.findOne(id);
    const canDelete = await this.healthService.canUserAccessRecord(record.pet_id, user.id);
    
    if (!canDelete) {
      throw new ForbiddenException('You can only delete health records for your own pets');
    }
    
    await this.healthService.remove(id);
    return { message: 'Health record deleted successfully' };
  }
}