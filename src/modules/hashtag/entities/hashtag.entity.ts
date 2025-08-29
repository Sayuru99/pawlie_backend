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
import { PostHashtag } from '@/modules/post/entities/post-hashtag.entity';

@Entity('hashtags')
export class Hashtag {
  @ApiProperty({ description: 'Hashtag ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Hashtag name' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Post count for the hashtag' })
  @Column({ type: 'integer', default: 0 })
  post_count: number;

  @OneToMany(() => PostHashtag, postHashtag => postHashtag.hashtag)
  postHashtags: PostHashtag[];

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}
