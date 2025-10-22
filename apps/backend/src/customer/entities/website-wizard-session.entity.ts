import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum WizardStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum WizardStep {
  BUSINESS_INFO = 'business_info',
  TEMPLATE_SELECTION = 'template_selection',
  DESIGN_PREFERENCES = 'design_preferences',
  CONTENT_CREATION = 'content_creation',
  AI_GENERATION = 'ai_generation',
  CUSTOMIZATION = 'customization',
  REVIEW = 'review',
  DEPLOYMENT = 'deployment',
}

@Entity('website_wizard_sessions')
export class WebsiteWizardSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_name', nullable: true })
  sessionName?: string;

  @Column({
    type: 'simple-enum',
    enum: WizardStatus,
    default: WizardStatus.DRAFT,
  })
  status: WizardStatus;

  @Column({
    type: 'simple-enum',
    enum: WizardStep,
    default: WizardStep.BUSINESS_INFO,
  })
  currentStep: WizardStep;

  @Column({ name: 'completed_steps', type: 'simple-array', default: '' })
  completedSteps: WizardStep[];

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  // Step data storage
  @Column({ name: 'business_info', type: 'json', nullable: true })
  businessInfo?: any;

  @Column({ name: 'template_selection', type: 'json', nullable: true })
  templateSelection?: any;

  @Column({ name: 'design_preferences', type: 'json', nullable: true })
  designPreferences?: any;

  @Column({ name: 'content_data', type: 'json', nullable: true })
  contentData?: any;

  @Column({ name: 'ai_generation_requests', type: 'json', nullable: true })
  aiGenerationRequests?: any;

  @Column({ name: 'customization_settings', type: 'json', nullable: true })
  customizationSettings?: any;

  @Column({ name: 'final_configuration', type: 'json', nullable: true })
  finalConfiguration?: any;

  // Generated site reference
  @Column({ name: 'generated_site_id', nullable: true })
  generatedSiteId?: string;

  @Column({ name: 'deployment_config', type: 'json', nullable: true })
  deploymentConfig?: any;

  // Session management
  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'last_activity_at' })
  lastActivityAt: Date;

  @Column({ name: 'estimated_completion_time', nullable: true })
  estimatedCompletionTime?: number; // in minutes

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isActive(): boolean {
    return this.status === WizardStatus.IN_PROGRESS && !this.isExpired;
  }

  get canProceedToNextStep(): boolean {
    return this.completedSteps.includes(this.currentStep);
  }

  markStepCompleted(step: WizardStep): void {
    if (!this.completedSteps.includes(step)) {
      this.completedSteps.push(step);
      this.updateProgress();
    }
  }

  private updateProgress(): void {
    const totalSteps = Object.keys(WizardStep).length;
    this.progressPercentage = Math.round(
      (this.completedSteps.length / totalSteps) * 100,
    );
  }

  constructor(partial: Partial<WebsiteWizardSession>) {
    Object.assign(this, partial);
  }
}
