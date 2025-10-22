import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../auth/entities/user.entity';
import { CustomerSite } from '../../customer/entities/customer-site.entity';
import { WizardSession } from '../../customer/entities/wizard-session.entity';

export enum RequestType {
  CONTENT = 'content',
  IMAGES = 'images',
  SERVICES = 'services',
  HERO = 'hero',
  ABOUT = 'about',
  TESTIMONIALS = 'testimonials',
  FAQ = 'faq',
  SEO = 'seo',
  BLOG = 'blog',
  CONTACT = 'contact',
  CUSTOM = 'custom',
}

export enum RequestStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity({ name: 'ai_requests' })
@Index(['customerId'])
@Index(['status'])
@Index(['requestType'])
@Index(['adminId'])
@Index(['createdAt'])
@Index(['priority'])
@Index(['wizardSessionId'])
export class AiRequest {
  @ApiProperty({ description: 'Unique AI request identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Customer who made the request' })
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Site identifier for the request' })
  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId?: string;

  @ApiProperty({ description: 'Type of AI content request', enum: RequestType })
  @Column({
    name: 'request_type',
    type: 'enum',
    enum: RequestType,
  })
  requestType: RequestType;

  @ApiProperty({ description: 'Business type for context' })
  @Column({ name: 'business_type' })
  businessType: string;

  @ApiProperty({ description: 'Business terminology preferences' })
  @Column({ type: 'text', nullable: true })
  terminology?: string;

  @ApiProperty({ description: 'Current request status', enum: RequestStatus })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ApiProperty({ description: 'Request priority level', enum: RequestPriority })
  @Column({
    type: 'varchar',
    length: '50',
    enum: RequestPriority,
    default: RequestPriority.NORMAL,
  })
  priority: RequestPriority;

  @ApiProperty({ description: 'Assigned admin user ID' })
  @Column({ name: 'admin_id', type: 'uuid', nullable: true })
  adminId?: string;

  @ApiProperty({ description: 'Request data from wizard steps' })
  @Column({ name: 'request_data', type: 'jsonb' })
  requestData: {
    companyName?: string;
    industry?: string;
    targetAudience?: string;
    keyServices?: string[];
    brandValues?: string[];
    competitorUrls?: string[];
    existingContent?: string;
    specificRequirements?: string;
    contentLength?: 'short' | 'medium' | 'long';
    tone?: 'professional' | 'friendly' | 'casual' | 'authoritative';
    language?: string;
    wizardStep?: number;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Generated AI content' })
  @Column({ name: 'generated_content', type: 'jsonb', nullable: true })
  generatedContent?: {
    content?: string;
    metadata?: {
      modelUsed?: string;
      tokensConsumed?: number;
      generationTime?: number;
      confidence?: number;
    };
    variations?: string[];
    keywords?: string[];
    [key: string]: any;
  };

  @ApiProperty({ description: 'Draft images uploaded during processing' })
  @Column({
    name: 'images_draft',
    type: 'jsonb',
    nullable: true,
    default: '{}',
  })
  imagesDraft?: Record<
    string,
    { url: string; filename: string; updatedAt: string }
  >;

  @ApiProperty({ description: 'Version counter for image updates' })
  @Column({ name: 'images_version', default: 0 })
  imagesVersion: number;

  @ApiProperty({ description: 'Processing notes from admin' })
  @Column({ name: 'processing_notes', type: 'text', nullable: true })
  processingNotes?: string;

  @ApiProperty({ description: 'Internal admin comments' })
  @Column({ name: 'admin_comments', type: 'text', nullable: true })
  adminComments?: string;

  @ApiProperty({ description: 'Wizard session identifier' })
  @Column({ name: 'wizard_session_id', type: 'uuid', nullable: true })
  wizardSessionId?: string;

  @ApiProperty({ description: 'Estimated cost for the request' })
  @Column({
    name: 'estimated_cost',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
  })
  estimatedCost: number;

  @ApiProperty({ description: 'Actual cost after processing' })
  @Column({
    name: 'actual_cost',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  actualCost?: number;

  @ApiProperty({ description: 'Number of revision requests' })
  @Column({ name: 'revision_count', default: 0 })
  revisionCount: number;

  @ApiProperty({ description: 'Customer feedback rating (1-5)' })
  @Column({ name: 'customer_rating', nullable: true })
  customerRating?: number;

  @ApiProperty({ description: 'Customer feedback text' })
  @Column({ name: 'customer_feedback', type: 'text', nullable: true })
  customerFeedback?: string;

  @ApiProperty({ description: 'Processing time in seconds' })
  @Column({ name: 'processing_duration', nullable: true })
  processingDuration?: number;

  @ApiProperty({ description: 'Error message if processing failed' })
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Retry attempt count' })
  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Request expires at this timestamp' })
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Request creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Request assignment timestamp' })
  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @ApiProperty({ description: 'Processing start timestamp' })
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'Request completion timestamp' })
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Request last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => CustomerSite, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site?: CustomerSite;

  @ManyToOne(() => WizardSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'wizard_session_id' })
  wizardSession?: WizardSession;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin?: User;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get totalDuration(): number | null {
    if (this.startedAt && this.completedAt) {
      return Math.floor(
        (this.completedAt.getTime() - this.startedAt.getTime()) / 1000,
      );
    }
    return null;
  }

  get isOverdue(): boolean {
    if (
      this.status === RequestStatus.COMPLETED ||
      this.status === RequestStatus.CANCELLED
    ) {
      return false;
    }
    // Consider a request overdue if it's been pending for more than 24 hours
    const hours24 = 24 * 60 * 60 * 1000;
    return new Date().getTime() - this.createdAt.getTime() > hours24;
  }

  constructor(partial: Partial<AiRequest>) {
    Object.assign(this, {
      status: RequestStatus.PENDING,
      priority: RequestPriority.NORMAL,
      estimatedCost: 0,
      revisionCount: 0,
      retryCount: 0,
      ...partial,
    });
  }
}
