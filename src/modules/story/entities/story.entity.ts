import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/user/entities/user.entity';
import { Pet } from '@/modules/pet/entities/pet.entity';

@Entity('stories')
export class Story {
  @ApiProperty({ description: 'Story ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Media URL' })
  @Column({ type: 'varchar', length: 500 })
  media_url: string;

  @ApiProperty({ description: 'Story caption', required: false })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'Pet ID', required: false })
  @Column({ type: 'uuid', nullable: true })
  pet_id?: string;

  @ApiProperty({ description: 'Story author', type: () => User })
  @ManyToOne(() => User, user => user.stories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Associated pet', type: () => Pet, required: false })
  @ManyToOne(() => Pet, pet => pet.stories, { nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Expiration date' })
  @Column({ type: 'timestamp' })
  expires_at: Date;
}