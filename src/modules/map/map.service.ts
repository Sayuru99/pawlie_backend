import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NearbySearchDto, SearchType } from './dto/nearby-search.dto';
import { User } from '../user/entities/user.entity';
import { Pet } from '../pet/entities/pet.entity';
import { UserType } from '../../common/enums/user-type.enum';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  async findNearby(searchDto: NearbySearchDto) {
    const { latitude, longitude, radius, type } = searchDto;
    const point = `POINT(${longitude} ${latitude})`;

    switch (type) {
      case SearchType.PETS:
        return this.findNearbyPets(point, radius);
      case SearchType.USERS:
        return this.findNearbyUsers(point, radius);
      case SearchType.PROFESSIONALS:
        return this.findNearbyProfessionals(point, radius);
      default:
        return this.findNearbyPets(point, radius);
    }
  }

  private async findNearbyPets(point: string, radius: number) {
    return this.petRepository
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .where('ST_DWithin(pet.location, ST_GeomFromText(:point, 4326), :radius)', {
        point,
        radius,
      })
      .select([
        'pet.id',
        'pet.name',
        'pet.species',
        'pet.breed',
        'pet.age',
        'pet.profile_picture',
        'owner.id',
        'owner.username',
        'owner.first_name',
        'owner.last_name',
      ])
      .limit(50)
      .getMany();
  }

  private async findNearbyUsers(point: string, radius: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('ST_DWithin(user.location, ST_GeomFromText(:point, 4326), :radius)', {
        point,
        radius,
      })
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
        'user.user_type',
      ])
      .limit(50)
      .getMany();
  }

  private async findNearbyProfessionals(point: string, radius: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.user_type = :userType', { userType: UserType.PROFESSIONAL })
      .andWhere('ST_DWithin(user.location, ST_GeomFromText(:point, 4326), :radius)', {
        point,
        radius,
      })
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.last_name',
        'user.profile_picture',
        'user.business_details',
      ])
      .limit(50)
      .getMany();
  }
}