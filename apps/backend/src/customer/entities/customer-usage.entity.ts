import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerSite } from './customer-site.entity';

export enum UsageType {
  SITE_CREATION = 'site_creation',
  AI_GENERATION = 'ai_generation',
  STORAGE = 'storage',
  BANDWIDTH = 'bandwidth',
  API_CALL = 'api_call',
  CUSTOM_DOMAIN = 'custom_domain',
}

@Entity('customer_usage')
export class CustomerUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'simple-enum',
    enum: UsageType,
  })
  type: UsageType;

  @Column({ type: 'decimal', precision: 15, scale: 6 })
  amount: number;

  @Column({ nullable: true })
  unit?: string; // MB, GB, requests, etc.

  @Column({ type: 'json', nullable: true })
  metadata?: any; // Additional context data

  @Column({ name: 'billing_period', type: 'varchar', length: 7 }) // YYYY-MM format
  billingPeriod: string;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerSite, (site) => site.usage, { nullable: true })
  @JoinColumn({ name: 'site_id' })
  site?: CustomerSite;

  @Column({ name: 'site_id', nullable: true })
  siteId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<CustomerUsage>) {
    Object.assign(this, partial);
  }
}
