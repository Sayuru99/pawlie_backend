import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity('likes')
@Unique(['user_id', 'post_id'])
export class Like {
  @ApiProperty({ description: 'Like ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who liked' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'Post ID that was liked' })
  @Column({ type: 'uuid' })
  post_id: string;

  @ApiProperty({ description: 'User who liked', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Post that was liked', type: () => Post })
  @ManyToOne(() => Post, post => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;
}