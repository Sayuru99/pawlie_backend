import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../../../common/enums/match-status.enum';
import { Pet } from '@/modules/pet/entities/pet.entity';

@Entity('matches')
export class Match {
  @ApiProperty({ description: 'Match ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'First pet ID' })
  @Column({ type: 'uuid' })
  pet1_id: string;

  @ApiProperty({ description: 'Second pet ID' })
  @Column({ type: 'uuid' })
  pet2_id: string;

  @ApiProperty({ description: 'Match status', enum: MatchStatus })
  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
  status: MatchStatus;

  @ApiProperty({ description: 'Match message', required: false })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'First pet', type: () => Pet })
  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet1_id' })
  pet1: Pet;

  @ApiProperty({ description: 'Second pet', type: () => Pet })
  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet2_id' })
  pet2: Pet;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;
}