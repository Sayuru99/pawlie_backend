import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

@Entity('admins')
export class Admin {
  @ApiProperty({ description: 'Admin ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @ApiProperty({ description: 'Admin role', enum: AdminRole })
  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.MODERATOR })
  role: AdminRole;

  @ApiProperty({ description: 'Admin permissions' })
  @Column({ type: 'jsonb', default: {} })
  permissions: {
    can_ban_users?: boolean;
    can_delete_posts?: boolean;
    can_manage_reports?: boolean;
    can_send_notifications?: boolean;
    can_view_analytics?: boolean;
    can_manage_payments?: boolean;
  };

  @ApiProperty({ description: 'Whether admin is active' })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiProperty({ description: 'Last login date' })
  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @ApiProperty({ description: 'Associated user', type: () => User })
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}