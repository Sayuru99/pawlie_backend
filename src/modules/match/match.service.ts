import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { PetService } from '../pet/pet.service';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly petService: PetService,
  ) {}

  async create(createMatchDto: CreateMatchDto, userId: string): Promise<Match> {
    const { pet1_id, pet2_id } = createMatchDto;
    
    if (pet1_id === pet2_id) {
      throw new BadRequestException('Cannot match a pet with itself');
    }

    // Verify pet1 ownership
    const pet1 = await this.petService.findOne(pet1_id);
    if (pet1.user_id !== userId) {
      throw new ForbiddenException('You can only create matches for your own pets');
    }

    // Verify pet2 exists
    await this.petService.findOne(pet2_id);

    // Check if match already exists
    const existingMatch = await this.matchRepository.findOne({
      where: [
        { pet1_id, pet2_id },
        { pet1_id: pet2_id, pet2_id: pet1_id },
      ],
    });

    if (existingMatch) {
      throw new BadRequestException('Match already exists between these pets');
    }

    const match = this.matchRepository.create(createMatchDto);
    return this.matchRepository.save(match);
  }

  async findUserMatches(userId: string): Promise<Match[]> {
    // Get user's pets
    const userPets = await this.petService.findAllByUser(userId);
    const petIds = userPets.map(pet => pet.id);

    if (petIds.length === 0) {
      return [];
    }

    return this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.pet1', 'pet1')
      .leftJoinAndSelect('match.pet2', 'pet2')
      .where('match.pet1_id IN (:...petIds) OR match.pet2_id IN (:...petIds)', { petIds })
      .orderBy('match.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['pet1', 'pet2'],
    });
    
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    
    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(id);
    Object.assign(match, updateMatchDto);
    return this.matchRepository.save(match);
  }

  async canUserUpdateMatch(match: Match, userId: string): Promise<boolean> {
    try {
      const pet1 = await this.petService.findOne(match.pet1_id);
      const pet2 = await this.petService.findOne(match.pet2_id);
      
      return pet1.user_id === userId || pet2.user_id === userId;
    } catch {
      return false;
    }
  }
}