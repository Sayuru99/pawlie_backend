import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchService } from './match.service';
import { PetService } from '../pet/pet.service';
import { Match } from './entities/match.entity';
import { Pet } from '../pet/entities/pet.entity';
import { User } from '../user/entities/user.entity';
import { MatchStatus } from '../../common/enums/match-status.enum';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

// Mock data
const user1 = { id: 'user-id-1' } as User;
const user2 = { id: 'user-id-2' } as User;

const pet1 = { id: 'pet-id-1', user_id: user1.id } as unknown as Pet;
const pet2 = { id: 'pet-id-2', user_id: user2.id } as unknown as Pet;
const pet3 = { id: 'pet-id-3', user_id: user2.id } as unknown as Pet;

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('MatchService', () => {
  let service: MatchService;
  let petService: PetService;
  let matchRepository: MockRepository<Match>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: PetService,
          useValue: {
            findOne: jest.fn(),
            findAllExcept: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Match),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    petService = module.get<PetService>(PetService);
    matchRepository = module.get<MockRepository<Match>>(getRepositoryToken(Match));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSwipeCandidates', () => {
    it('should return potential candidates', async () => {
      jest.spyOn(petService, 'findOne').mockResolvedValue(pet1);
      matchRepository.find.mockResolvedValue([]);
      jest.spyOn(petService, 'findAllExcept').mockResolvedValue([pet2, pet3]);

      const result = await service.getSwipeCandidates(pet1.id, user1.id);

      expect(petService.findOne).toHaveBeenCalledWith(pet1.id);
      expect(matchRepository.find).toHaveBeenCalled();
      expect(petService.findAllExcept).toHaveBeenCalledWith(user1.id, [pet1.id]);
      expect(result).toEqual([pet2, pet3]);
    });

    it('should throw ForbiddenException if pet does not belong to user', async () => {
      jest.spyOn(petService, 'findOne').mockResolvedValue(pet1); // pet1 owned by user1
      await expect(service.getSwipeCandidates(pet1.id, user2.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleSwipe', () => {
    beforeEach(() => {
      jest.spyOn(petService, 'findOne').mockImplementation(async (id) => {
        if (id === pet1.id) return pet1;
        if (id === pet2.id) return pet2;
        return null;
      });
    });

    it('should throw BadRequestException when swiping on oneself', async () => {
      await expect(service.handleSwipe(pet1.id, pet1.id, 'right', user1.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if swiper pet is not owned by user', async () => {
      await expect(service.handleSwipe(pet1.id, pet2.id, 'right', user2.id)).rejects.toThrow(ForbiddenException);
    });

    it('should create a new PENDING match on right swipe (one-way like)', async () => {
      matchRepository.findOne.mockResolvedValue(null); // No existing match
      const newMatch = { pet1_id: pet1.id, pet2_id: pet2.id, status: MatchStatus.PENDING };
      matchRepository.create.mockReturnValue(newMatch as any);
      matchRepository.save.mockResolvedValue(newMatch as any);

      const result = await service.handleSwipe(pet1.id, pet2.id, 'right', user1.id);

      expect(matchRepository.create).toHaveBeenCalledWith({
        pet1_id: pet1.id,
        pet2_id: pet2.id,
        status: MatchStatus.PENDING,
      });
      expect(result.status).toBe(MatchStatus.PENDING);
    });

    it('should update to MATCHED on right swipe (mutual like)', async () => {
      const reverseMatch = { id: 'match-id', pet1_id: pet2.id, pet2_id: pet1.id, status: MatchStatus.PENDING, save: jest.fn() };
      matchRepository.findOne.mockResolvedValue(reverseMatch);
      matchRepository.save.mockImplementation(async (match) => match);

      const result = await service.handleSwipe(pet1.id, pet2.id, 'right', user1.id);

      expect(result.status).toBe(MatchStatus.MATCHED);
      expect(matchRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: MatchStatus.MATCHED }));
    });

    it('should create a new REJECTED match on left swipe', async () => {
        matchRepository.findOne.mockResolvedValue(null); // No existing match
        const newMatch = { pet1_id: pet1.id, pet2_id: pet2.id, status: MatchStatus.REJECTED };
        matchRepository.create.mockReturnValue(newMatch as any);
        matchRepository.save.mockResolvedValue(newMatch as any);

        const result = await service.handleSwipe(pet1.id, pet2.id, 'left', user1.id);

        expect(matchRepository.create).toHaveBeenCalledWith({
          pet1_id: pet1.id,
          pet2_id: pet2.id,
          status: MatchStatus.REJECTED,
        });
        expect(result.status).toBe(MatchStatus.REJECTED);
      });

    it('should throw BadRequestException if match is already decided', async () => {
        const existingMatch = { id: 'match-id', status: MatchStatus.MATCHED };
        matchRepository.findOne.mockResolvedValue(existingMatch);

        await expect(service.handleSwipe(pet1.id, pet2.id, 'right', user1.id)).rejects.toThrow(BadRequestException);
    });
  });
});
