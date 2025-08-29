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
import { Visibility } from '../../../common/enums/visibility.enum';
import { User } from '@/modules/user/entities/user.entity';
import { Pet } from '@/modules/pet/entities/pet.entity';
import { Like } from '../../../modules/like/entities/like.entity';
import { Comment } from '../../../modules/comment/entities/comment.entity';

@Entity('posts')
export class Post {
  @ApiProperty({ description: 'Post ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Post content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Media URLs' })
  @Column({ type: 'text', array: true, default: [] })
  media_urls: string[];

  @ApiProperty({ description: 'Post visibility', enum: Visibility })
  @Column({ type: 'enum', enum: Visibility, default: Visibility.PUBLIC })
  visibility: Visibility;

  @ApiProperty({ description: 'Likes count' })
  @Column({ type: 'integer', default: 0 })
  likes_count: number;

  @ApiProperty({ description: 'Comments count' })
  @Column({ type: 'integer', default: 0 })
  comments_count: number;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'Pet ID', required: false })
  @Column({ type: 'uuid', nullable: true })
  pet_id?: string;

  @ApiProperty({ description: 'Post author', type: () => User })
  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Associated pet', type: () => Pet, required: false })
  @ManyToOne(() => Pet, pet => pet.posts, { nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ApiProperty({ description: 'Post likes', type: () => [Like] })
  @OneToMany(() => Like, like => like.post)
  likes: Like[];

  @ApiProperty({ description: 'Post comments', type: () => [Comment] })
  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}