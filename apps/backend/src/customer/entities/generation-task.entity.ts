import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { WizardSession } from './wizard-session.entity';

/**
 * Generation Task Status
 */
export enum GenerationTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Generation Task Entity
 *
 * Tracks the progress of site generation processes initiated from Step 7.
 * Provides real-time progress updates to the frontend during generation.
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Entity('generation_tasks')
export class GenerationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'wizard_session_id' })
  wizardSessionId: string;

  @ManyToOne(() => WizardSession)
  @JoinColumn({ name: 'wizard_session_id' })
  wizardSession: WizardSession;

  @Column({ name: 'site_id', nullable: true })
  siteId?: string;

  @Column({ name: 'deployment_port', type: 'integer', nullable: true })
  port?: number;

  @Column({ name: 'site_url', type: 'varchar', length: 255, nullable: true })
  siteUrl?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: GenerationTaskStatus.PENDING,
  })
  status: GenerationTaskStatus;

  @Column({ type: 'integer', default: 0 })
  progress: number;

  @Column({ name: 'current_step', nullable: true })
  currentStep?: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({
    type: 'timestamp',
    name: 'started_at',
    nullable: true,
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp',
    name: 'completed_at',
    nullable: true,
  })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<GenerationTask>) {
    Object.assign(this, partial);
  }
}
