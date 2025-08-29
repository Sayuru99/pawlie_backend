import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

@Entity('reviews')
export class Review {
  @ApiProperty({ description: 'Review ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @Column({ type: 'int' })
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({ description: 'Reviewer ID' })
  @Column({ type: 'uuid' })
  reviewer_id: string;

  @ApiProperty({ description: 'Reviewed user ID' })
  @Column({ type: 'uuid' })
  reviewed_user_id: string;

  @ApiProperty({ description: 'Reviewer' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ApiProperty({ description: 'Reviewed user' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_user_id' })
  reviewed_user: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;
}