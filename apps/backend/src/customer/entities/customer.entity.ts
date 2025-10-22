import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum CustomerTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity({ name: 'customers' })
@Index(['userId'])
@Index(['status'])
@Index(['tier'])
@Index(['createdAt'])
export class Customer {
  @ApiProperty({ description: 'Unique customer identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Associated user ID' })
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @ApiProperty({ description: 'Company or business name' })
  @Column({ name: 'company_name', nullable: true })
  companyName?: string;

  @ApiProperty({ description: 'Business type or industry' })
  @Column({ name: 'business_type', nullable: true })
  businessType?: string;

  @ApiProperty({ description: 'Customer phone number' })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @ApiProperty({ description: 'Business address' })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({ description: 'Business website URL' })
  @Column({ name: 'website_url', nullable: true })
  websiteUrl?: string;

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus })
  @Column({
    type: 'varchar',
    length: '50',
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @ApiProperty({
    description: 'Customer subscription tier',
    enum: CustomerTier,
  })
  @Column({
    type: 'varchar',
    length: '50',
    default: CustomerTier.FREE,
  })
  tier: CustomerTier;

  @ApiProperty({ description: 'Customer billing information' })
  @Column({ type: 'text', nullable: true })
  billingInfo?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    paymentMethodId?: string;
    billingAddress?: any;
  };

  @ApiProperty({ description: 'Customer preferences and settings' })
  @Column({ type: 'text', default: '{}' })
  preferences: {
    aiContentPreferences?: {
      tone?: string;
      style?: string;
      terminology?: string[];
    };
    notificationSettings?: {
      email?: boolean;
      sms?: boolean;
    };
    [key: string]: any;
  };

  @ApiProperty({ description: 'Customer metadata and custom fields' })
  @Column({ type: 'text', default: '{}' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Number of sites created' })
  @Column({ name: 'sites_count', default: 0 })
  sitesCount: number;

  @ApiProperty({ description: 'Number of AI requests made' })
  @Column({ name: 'ai_requests_count', default: 0 })
  aiRequestsCount: number;

  @ApiProperty({ description: 'Total amount spent on AI services' })
  @Column({
    name: 'total_spent',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  @ApiProperty({ description: 'Customer is active' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Customer creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Customer last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, {
      status: CustomerStatus.ACTIVE,
      tier: CustomerTier.FREE,
      preferences: {},
      metadata: {},
      sitesCount: 0,
      aiRequestsCount: 0,
      totalSpent: 0,
      isActive: true,
      ...partial,
    });
  }
}
