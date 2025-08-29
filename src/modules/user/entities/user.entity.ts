import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../../common/enums/user-type.enum';
import { Visibility } from '../../../common/enums/visibility.enum';
import { Pet } from '../../pet/entities/pet.entity';
import { Post } from '../../post/entities/post.entity';
import { Story } from '../../story/entities/story.entity';
import { UserFollow } from './user-follow.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'First name' })
  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @ApiProperty({ description: 'Username' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @ApiProperty({ description: 'Email address' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  current_hashed_refresh_token?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  reset_token_expires?: Date;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true, select: false })
  email_verification_otp?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  email_verification_expires?: Date;

  @Column({ type: 'boolean', default: false })
  is_banned: boolean;

  @Column({ type: 'text', nullable: true })
  ban_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  ban_expires_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  banned_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  banned_at?: Date;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_picture?: string;

  @ApiProperty({ description: 'User bio', required: false })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @ApiProperty({ description: 'User location coordinates', required: false })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location?: any;

  @ApiProperty({ description: 'User type', enum: UserType })
  @Column({ type: 'enum', enum: UserType, default: UserType.NORMAL })
  user_type: UserType;

  @ApiProperty({ description: 'Business details for professional users', required: false })
  @Column({ type: 'jsonb', nullable: true })
  business_details?: {
    name?: string;
    services?: string[];
    hours?: string;
    category?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  @ApiProperty({ description: 'Whether user is verified' })
  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @ApiProperty({ description: 'Verification expiry date', required: false })
  @Column({ type: 'timestamp', nullable: true })
  verification_expires_at?: Date;

  @ApiProperty({ description: 'User preferences', required: false })
  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    preferred_breeds?: string[];
    services?: string[];
    age_range?: string;
  };

  @ApiProperty({ description: 'Notification preferences' })
  @Column({
    type: 'jsonb',
    default: {
      follow: true,
      like: true,
      comment: true,
      story: true,
      event_rsvp: true,
    },
  })
  notification_preferences: {
    follow: boolean;
    like: boolean;
    comment: boolean;
    story: boolean;
    event_rsvp: boolean;
  };

  @ApiProperty({ description: 'Number of followers' })
  @Column({ type: 'integer', default: 0 })
  followers_count: number;

  @ApiProperty({ description: 'Number of followings' })
  @Column({ type: 'integer', default: 0 })
  followings_count: number;

  @OneToMany(() => UserFollow, userFollow => userFollow.followee)
  followers: UserFollow[];

  @OneToMany(() => UserFollow, userFollow => userFollow.follower)
  followings: UserFollow[];

  @ApiProperty({ description: 'List of blocked user IDs' })
  @Column({ type: 'uuid', array: true, default: [] })
  blocked_users: string[];

  @ApiProperty({ description: 'List of restricted user IDs' })
  @Column({ type: 'uuid', array: true, default: [] })
  restricted_users: string[];

  @ApiProperty({ description: 'Profile visibility', enum: Visibility })
  @Column({ type: 'enum', enum: Visibility, default: Visibility.PUBLIC })
  visibility: Visibility;

  @ApiProperty({ description: 'Pet profiles owned by this user' })
  @OneToMany(() => Pet, pet => pet.owner)
  pets: Pet[];

  @ApiProperty({ description: 'Posts created by this user' })
  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @ApiProperty({ description: 'Stories created by this user' })
  @OneToMany(() => Story, story => story.user)
  stories: Story[];
  @ApiProperty({ description: 'Account creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}