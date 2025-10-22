import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { SiteDomain } from './site-domain.entity';

export enum WizardSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('wizard_sessions')
@Index(['userId'])
@Index(['sessionId'])
@Index(['status'])
@Index(['lastAccessedAt'])
@Index(['deploymentStatus'])
export class WizardSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'session_id', unique: true })
  sessionId: string;

  @Column({ name: 'site_name' })
  siteName: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ name: 'current_step', default: 0 })
  currentStep: number;

  @Column({ name: 'business_type', nullable: true })
  businessType?: string;

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({ name: 'wizard_data', type: 'jsonb', nullable: true })
  wizardData?: any;

  @Column({ name: 'ai_requests', type: 'jsonb', nullable: true })
  aiRequests?: any;

  @Column({
    type: 'enum',
    enum: WizardSessionStatus,
    default: WizardSessionStatus.ACTIVE,
  })
  status: WizardSessionStatus;

  @Column({
    name: 'last_accessed_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastAccessedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'active_domain_id', type: 'uuid', nullable: true })
  activeDomainId?: string;

  @Column({
    name: 'deployment_status',
    type: 'varchar',
    length: 50,
    default: 'draft',
  })
  deploymentStatus: string; // 'draft', 'building', 'deployed', 'stopped', 'error'

  @Column({ name: 'last_deployed_at', type: 'timestamp', nullable: true })
  lastDeployedAt?: Date;

  @Column({ name: 'site_url', type: 'varchar', length: 255, nullable: true })
  siteUrl?: string; // https://mybusiness.logen.locod-ai.com

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => SiteDomain, { nullable: true })
  @JoinColumn({ name: 'active_domain_id' })
  activeDomain?: SiteDomain;

  // Helper methods
  getStepName(): string {
    const stepNames = [
      'Welcome & Terms',
      'Template Selection',
      'Business Information',
      'Content & Services',
      'Images & Logo',
      'Advanced Features',
      'Final Review',
    ];
    return stepNames[this.currentStep] || 'Unknown';
  }

  calculateProgress(): number {
    return Math.round(((this.currentStep + 1) / 7) * 100);
  }

  updateProgress(): void {
    this.progressPercentage = this.calculateProgress();
    this.lastAccessedAt = new Date();
  }

  toDto() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      siteName: this.siteName,
      domain: this.domain,
      currentStep: this.currentStep,
      businessType: this.businessType,
      progress: this.progressPercentage,
      currentStepName: this.getStepName(),
      status: this.status,
      deploymentStatus: this.deploymentStatus,
      siteUrl: this.siteUrl,
      lastDeployedAt: this.lastDeployedAt,
      lastUpdated: this.lastAccessedAt,
      createdAt: this.createdAt,
    };
  }
}
