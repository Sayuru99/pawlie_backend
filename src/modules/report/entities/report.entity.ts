import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '../../../common/enums/report-status.enum';
import { User } from '../../user/entities/user.entity';

export enum ReportType {
  POST = 'post',
  USER = 'user',
  COMMENT = 'comment',
  PET = 'pet',
}

export enum ReportCategory {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  FAKE_ACCOUNT = 'fake_account',
  COPYRIGHT = 'copyright',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

@Entity('reports')
export class Report {
  @ApiProperty({ description: 'Report ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Reporter user ID' })
  @Column({ type: 'uuid' })
  reporter_id: string;

  @ApiProperty({ description: 'Reported target ID (post, user, comment, etc.)' })
  @Column({ type: 'uuid' })
  target_id: string;

  @ApiProperty({ description: 'Type of content being reported', enum: ReportType })
  @Column({ type: 'enum', enum: ReportType })
  target_type: ReportType;

  @ApiProperty({ description: 'Report category', enum: ReportCategory })
  @Column({ type: 'enum', enum: ReportCategory })
  category: ReportCategory;

  @ApiProperty({ description: 'Additional details about the report' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Report status', enum: ReportStatus })
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ description: 'Admin who reviewed the report', required: false })
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @ApiProperty({ description: 'Admin review notes', required: false })
  @Column({ type: 'text', nullable: true })
  review_notes?: string;

  @ApiProperty({ description: 'Date when report was reviewed', required: false })
  @Column({ type: 'timestamp', nullable: true })
  reviewed_at?: Date;

  @ApiProperty({ description: 'Reporter user', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ApiProperty({ description: 'Admin who reviewed', type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}