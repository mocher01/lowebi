import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerUsage } from './customer-usage.entity';
import { WizardSession } from './wizard-session.entity';

export enum SiteStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  SUSPENDED = 'suspended',
  BUILDING = 'building',
  ERROR = 'error',
}

export enum SiteTemplate {
  BUSINESS = 'business',
  PORTFOLIO = 'portfolio',
  BLOG = 'blog',
  ECOMMERCE = 'ecommerce',
  LANDING = 'landing',
  RESTAURANT = 'restaurant',
  AGENCY = 'agency',
  PERSONAL = 'personal',
}

@Entity('customer_sites')
export class CustomerSite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ unique: true })
  domain: string;

  @Column({ name: 'business_type', nullable: true })
  businessType?: string;

  @Column({
    type: 'simple-enum',
    enum: SiteStatus,
    default: SiteStatus.DRAFT,
  })
  status: SiteStatus;

  @Column({ name: 'deployment_url', nullable: true })
  deploymentUrl?: string;

  @Column({ type: 'timestamp', name: 'last_deployed_at', nullable: true })
  lastDeployedAt?: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'site_config', type: 'jsonb', nullable: true })
  siteConfig?: any;

  // Legacy compatibility getter for admin services
  get configuration() {
    return this.siteConfig;
  }
  set configuration(value: any) {
    this.siteConfig = value;
  }

  @Column({ name: 'content', type: 'jsonb', nullable: true })
  content?: any;

  @Column({ name: 'deployment_status', nullable: true })
  deploymentStatus?: string;

  @Column({ name: 'page_views', default: 0 })
  pageViews: number;

  @Column({ name: 'visitor_count', default: 0 })
  visitorCount: number;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: string;

  @OneToMany(() => CustomerUsage, (usage) => usage.site)
  usage: CustomerUsage[];

  @Column({ name: 'current_wizard_session_id', nullable: true })
  currentWizardSessionId?: string;

  @ManyToOne(() => WizardSession, { nullable: true })
  @JoinColumn({ name: 'current_wizard_session_id' })
  currentWizardSession?: WizardSession;

  // Step 7 Generation Fields
  @Column({ name: 'site_id', unique: true, nullable: true })
  siteId?: string;

  @Column({ name: 'deployment_port', nullable: true })
  deploymentPort?: number;

  @Column({ type: 'timestamp', name: 'deployed_at', nullable: true })
  deployedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(partial: Partial<CustomerSite>) {
    Object.assign(this, partial);
  }
}
