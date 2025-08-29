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
import { User } from '../../user/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  VERIFICATION = 'verification',
  PREMIUM_FEATURES = 'premium_features',
  ADVERTISEMENT = 'advertisement',
  EXTRA_PET_PROFILE = 'extra_pet_profile',
}

export interface PayHereResponse {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: number;
  payhere_currency: string;
  status_code: number;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
  card_holder_name?: string;
  card_no?: string;
}

@Entity('payments')
export class Payment {
  @ApiProperty({ description: 'Payment ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ description: 'PayHere order ID' })
  @Column({ type: 'varchar', length: 255, unique: true })
  order_id: string;

  @ApiProperty({ description: 'Payment amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @Column({ type: 'varchar', length: 3, default: 'LKR' })
  currency: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  @Column({ type: 'enum', enum: PaymentType })
  payment_type: PaymentType;

  @ApiProperty({ description: 'Payment description' })
  @Column({ type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({ description: 'PayHere payment ID' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  payhere_payment_id?: string;

  @ApiProperty({ description: 'PayHere response data' })
  @Column({ type: 'jsonb', nullable: true })
  payhere_response?: PayHereResponse;

  @ApiProperty({ description: 'Payment metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    subscription_months?: number;
    feature_type?: string;
    expires_at?: Date;
  };

  @ApiProperty({ description: 'User who made the payment', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;
}