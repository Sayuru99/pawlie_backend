import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { HealthRecord } from './entities/health-record.entity';
import { PetService } from '../pet/pet.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
    private readonly petService: PetService,
  ) {}

  async create(createHealthRecordDto: CreateHealthRecordDto, userId: string): Promise<HealthRecord> {
    // Verify pet ownership
    const pet = await this.petService.findOne(createHealthRecordDto.pet_id);
    if (pet.user_id !== userId) {
      throw new ForbiddenException('You can only create health records for your own pets');
    }

    const healthRecord = this.healthRecordRepository.create(createHealthRecordDto);
    return this.healthRecordRepository.save(healthRecord);
  }

  async findByPet(petId: string, userId: string): Promise<HealthRecord[]> {
    // Verify pet ownership
    const pet = await this.petService.findOne(petId);
    if (pet.user_id !== userId) {
      throw new ForbiddenException('You can only view health records for your own pets');
    }

    return this.healthRecordRepository.find({
      where: { pet_id: petId },
      relations: ['pet'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<HealthRecord> {
    const record = await this.healthRecordRepository.findOne({
      where: { id },
      relations: ['pet'],
    });
    
    if (!record) {
      throw new NotFoundException('Health record not found');
    }
    
    return record;
  }

  async update(id: string, updateHealthRecordDto: UpdateHealthRecordDto): Promise<HealthRecord> {
    const record = await this.findOne(id);
    Object.assign(record, updateHealthRecordDto);
    return this.healthRecordRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const result = await this.healthRecordRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Health record not found');
    }
  }

  async canUserAccessRecord(petId: string, userId: string): Promise<boolean> {
    try {
      const pet = await this.petService.findOne(petId);
      return pet.user_id === userId;
    } catch {
      return false;
    }
  }
}