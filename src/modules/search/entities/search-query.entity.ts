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

@Entity('search_queries')
export class SearchQuery {
  @ApiProperty({ description: 'Search Query ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The search query text' })
  @Column({ type: 'varchar', length: 255 })
  query: string;

  @ApiProperty({ description: 'User ID of the searcher', required: false })
  @Column({ type: 'uuid', nullable: true })
  user_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;
}
