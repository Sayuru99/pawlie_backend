import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Post } from '../../post/entities/post.entity';

@Entity('post_analytics')
export class PostAnalytic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  post_id: string;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @Column({ type: 'int', default: 0 })
  profile_visits: number;
}
