import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { User } from '../user/entities/user.entity';
import { Pet } from '../pet/entities/pet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Pet]),
  ],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}