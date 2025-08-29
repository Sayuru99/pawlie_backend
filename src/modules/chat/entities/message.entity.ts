import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Match } from '../match/entities/match.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ type: 'uuid' })
  match_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @CreateDateColumn()
  created_at: Date;
}
