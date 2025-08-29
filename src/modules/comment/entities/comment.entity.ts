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
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity('comments')
export class Comment {
  @ApiProperty({ description: 'Comment ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Comment content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'User ID who commented' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'Post ID' })
  @Column({ type: 'uuid' })
  post_id: string;

  @ApiProperty({ description: 'Parent comment ID for replies' })
  @Column({ type: 'uuid', nullable: true })
  parent_id?: string;

  @ApiProperty({ description: 'Number of likes on this comment' })
  @Column({ type: 'integer', default: 0 })
  likes_count: number;

  @ApiProperty({ description: 'User who commented', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Post being commented on', type: () => Post })
  @ManyToOne(() => Post, post => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ApiProperty({ description: 'Parent comment for replies', type: () => Comment, required: false })
  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @ApiProperty({ description: 'Replies to this comment', type: () => [Comment] })
  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}