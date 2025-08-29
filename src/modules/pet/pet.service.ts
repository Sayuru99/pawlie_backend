import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    private readonly storageService: StorageService,
  ) {}

  async create(createPetDto: CreatePetDto, userId: string): Promise<Pet> {
    const pet = this.petRepository.create({
      ...createPetDto,
      user_id: userId,
    });
    return this.petRepository.save(pet);
  }

  async findAllByUser(userId: string): Promise<Pet[]> {
    return this.petRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    
    return pet;
  }

  async update(id: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    const pet = await this.findOne(id);
    Object.assign(pet, updatePetDto);
    return this.petRepository.save(pet);
  }

  async remove(id: string): Promise<void> {
    const result = await this.petRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Pet not found');
    }
  }

  async uploadPicture(id: string, file: Express.Multer.File): Promise<Pet> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const pet = await this.findOne(id);
    const imageUrl = await this.storageService.uploadFile(file, 'pets');
    
    pet.profile_picture = imageUrl;
    return this.petRepository.save(pet);
  }

  async findAllExcept(ownerId: string, excludedPetIds: string[]): Promise<Pet[]> {
    const query = this.petRepository.createQueryBuilder('pet')
      .where('pet.owner_id != :ownerId', { ownerId });

    if (excludedPetIds && excludedPetIds.length > 0) {
      query.andWhere('pet.id NOT IN (:...excludedPetIds)', { excludedPetIds });
    }

    // Add some default ordering and pagination for production readiness
    return query.orderBy('pet.created_at', 'DESC').take(20).getMany();
  }
}