import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_follows')
export class UserFollow {
  @PrimaryColumn({ type: 'uuid' })
  follower_id: string;

  @PrimaryColumn({ type: 'uuid' })
  followee_id: string;

  @ManyToOne(() => User, user => user.followings)
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, user => user.followers)
  @JoinColumn({ name: 'followee_id' })
  followee: User;

  @CreateDateColumn()
  created_at: Date;
}
