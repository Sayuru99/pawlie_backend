import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { PetService } from '../pet/pet.service';
import { MatchStatus } from '../../common/enums/match-status.enum';
import { Pet } from '../pet/entities/pet.entity';

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

  async getSwipeCandidates(petId: string, userId: string): Promise<Pet[]> {
    // 1. Find the pet that is swiping to confirm it belongs to the user
    const swipingPet = await this.petService.findOne(petId);
    if (swipingPet.user_id !== userId) {
      throw new ForbiddenException('You can only find matches for your own pets.');
    }

    // 2. Find all pets this pet has already interacted with
    const existingMatches = await this.matchRepository.find({
      where: [
        { pet1_id: petId },
        { pet2_id: petId },
      ],
    });
    const interactedPetIds = existingMatches.map(match => {
      return match.pet1_id === petId ? match.pet2_id : match.pet1_id;
    });

    // Also exclude the swiping pet itself
    interactedPetIds.push(petId);

    // 3. Find all potential candidates
    //    - Not owned by the current user
    //    - Not already interacted with
    const candidates = await this.petService.findAllExcept(userId, interactedPetIds);

    return candidates;
  }

  async handleSwipe(swiperPetId: string, targetPetId: string, direction: 'left' | 'right', userId: string): Promise<Match> {
    if (swiperPetId === targetPetId) {
      throw new BadRequestException('A pet cannot swipe on itself.');
    }

    // 1. Verify ownership of the swiping pet
    const swiperPet = await this.petService.findOne(swiperPetId);
    if (swiperPet.user_id !== userId) {
      throw new ForbiddenException('You can only swipe for your own pets.');
    }

    // 2. Verify the target pet exists
    await this.petService.findOne(targetPetId);

    // 3. Check for an existing match record in either direction
    const existingMatch = await this.matchRepository.findOne({
      where: [
        { pet1_id: swiperPetId, pet2_id: targetPetId },
        { pet1_id: targetPetId, pet2_id: swiperPetId },
      ],
    });

    if (existingMatch) {
      // If a decision was already made (matched/rejected), don't allow a new one.
      if (existingMatch.status === 'matched' || existingMatch.status === 'rejected') {
        throw new BadRequestException('A match decision has already been made for these pets.');
      }
    }

    // Handle a right swipe (like)
    if (direction === 'right') {
      // Check if the other pet has already liked the current pet
      const reverseMatch = await this.matchRepository.findOne({
        where: { pet1_id: targetPetId, pet2_id: swiperPetId, status: MatchStatus.PENDING },
      });

      if (reverseMatch) {
        // It's a mutual match! Update the existing record.
        reverseMatch.status = MatchStatus.MATCHED;
        // In a real app, you'd also create a notification here.
        return this.matchRepository.save(reverseMatch);
      } else {
        // It's a one-way like. Create a new pending record.
        // But first, make sure we don't create a duplicate pending record.
        if (existingMatch && existingMatch.status === MatchStatus.PENDING) {
            return existingMatch; // A pending swipe already exists, do nothing.
        }
        const newMatch = this.matchRepository.create({
          pet1_id: swiperPetId,
          pet2_id: targetPetId,
          status: MatchStatus.PENDING,
        });
        return this.matchRepository.save(newMatch);
      }
    }
    // Handle a left swipe (reject)
    else {
        // If there's an existing pending match from the other user, we can just delete it or mark as rejected.
        // For simplicity, we'll create a 'rejected' record to prevent them from seeing each other again.
        if (existingMatch) {
            existingMatch.status = MatchStatus.REJECTED;
            return this.matchRepository.save(existingMatch);
        }
        const newMatch = this.matchRepository.create({
            pet1_id: swiperPetId,
            pet2_id: targetPetId,
            status: MatchStatus.REJECTED,
        });
        return this.matchRepository.save(newMatch);
    }
  }
}