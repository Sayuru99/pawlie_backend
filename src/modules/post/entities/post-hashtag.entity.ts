import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';
import { Hashtag } from '@/modules/hashtag/entities/hashtag.entity';

@Entity('post_hashtags')
export class PostHashtag {
  @PrimaryColumn({ type: 'uuid' })
  post_id: string;

  @PrimaryColumn({ type: 'uuid' })
  hashtag_id: string;

  @ManyToOne(() => Post, post => post.postHashtags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Hashtag, hashtag => hashtag.postHashtags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hashtag_id' })
  hashtag: Hashtag;
}
