import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RecordType } from '../../../common/enums/record-type.enum';
import { Pet } from '@/modules/pet/entities/pet.entity';

@Entity('health_records')
export class HealthRecord {
  @ApiProperty({ description: 'Health record ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Record type', enum: RecordType })
  @Column({ type: 'enum', enum: RecordType })
  type: RecordType;

  @ApiProperty({ description: 'Record date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Record notes' })
  @Column({ type: 'text' })
  notes: string;

  @ApiProperty({ description: 'Veterinarian name', required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  veterinarian?: string;

  @ApiProperty({ description: 'Pet ID' })
  @Column({ type: 'uuid' })
  pet_id: string;

  @ApiProperty({ description: 'Associated pet', type: () => Pet })
  @ManyToOne(() => Pet, pet => pet.health_records)
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}