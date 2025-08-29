import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { HealthRecord } from '@/modules/health/entities/health-record.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Story } from '@/modules/story/entities/story.entity';
import { Post } from '@/modules/post/entities/post.entity';

@Entity('pets')
export class Pet {
  @ApiProperty({ description: 'Pet ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Pet name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Pet species' })
  @Column({ type: 'varchar', length: 50 })
  species: string;

  @ApiProperty({ description: 'Pet breed' })
  @Column({ type: 'varchar', length: 100 })
  breed: string;

  @ApiProperty({ description: 'Pet age' })
  @Column({ type: 'varchar', length: 20 })
  age: string;

  @ApiProperty({ description: 'Pet gender' })
  @Column({ type: 'varchar', length: 20 })
  gender: string;

  @ApiProperty({ description: 'Pet bio', required: false })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({ description: 'Pet profile picture URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_picture?: string;

  @ApiProperty({ description: 'Pet location coordinates', required: false })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location?: any;

  @ApiProperty({ description: 'Owner ID' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'Pet owner', type: () => User })
  @ManyToOne(() => User, user => user.pets)
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @ApiProperty({ description: 'Pet posts', type: () => [Post] })
  @OneToMany(() => Post, post => post.pet)
  posts: Post[];

  @ApiProperty({ description: 'Pet stories', type: () => [Story] })
  @OneToMany(() => Story, story => story.pet)
  stories: Story[];

  @ApiProperty({ description: 'Pet health records', type: () => [HealthRecord] })
  @OneToMany(() => HealthRecord, record => record.pet)
  health_records: HealthRecord[];

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}