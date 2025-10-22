import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AiRequest, RequestStatus } from './ai-request.entity';
import { User } from '../../auth/entities/user.entity';

export enum ChangeType {
  STATUS_CHANGE = 'status_change',
  ASSIGNMENT_CHANGE = 'assignment_change',
  PRIORITY_CHANGE = 'priority_change',
  CONTENT_UPDATE = 'content_update',
  NOTES_UPDATE = 'notes_update',
  COST_UPDATE = 'cost_update',
  EXPIRY_UPDATE = 'expiry_update',
  RETRY_ATTEMPT = 'retry_attempt',
  REVISION_REQUEST = 'revision_request',
  CUSTOMER_FEEDBACK = 'customer_feedback',
}

@Entity({ name: 'ai_request_history' })
@Index(['requestId', 'timestamp'])
@Index(['changeType', 'timestamp'])
@Index(['changedBy'])
@Index(['timestamp'])
export class AiRequestHistory {
  @ApiProperty({ description: 'Unique history record identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'AI request this history belongs to' })
  @Column({ name: 'request_id' })
  requestId: string;

  @ApiProperty({ description: 'Type of change made', enum: ChangeType })
  @Column({
    name: 'change_type',
    type: 'varchar',
    length: '50',
    enum: ChangeType,
  })
  changeType: ChangeType;

  @ApiProperty({ description: 'Previous status if status changed' })
  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: '50',
    enum: RequestStatus,
    nullable: true,
  })
  previousStatus?: RequestStatus;

  @ApiProperty({ description: 'New status if status changed' })
  @Column({
    name: 'new_status',
    type: 'varchar',
    length: '50',
    enum: RequestStatus,
    nullable: true,
  })
  newStatus?: RequestStatus;

  @ApiProperty({ description: 'Previous value before change' })
  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue?: any;

  @ApiProperty({ description: 'New value after change' })
  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: any;

  @ApiProperty({ description: 'User who made the change' })
  @Column({ name: 'changed_by' })
  changedBy: string;

  @ApiProperty({ description: 'Role of the user who made the change' })
  @Column({ name: 'changed_by_role', default: 'admin' })
  changedByRole: 'admin' | 'customer' | 'system';

  @ApiProperty({ description: 'Reason for the change' })
  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason?: string;

  @ApiProperty({ description: 'Additional details about the change' })
  @Column({ type: 'text', default: '{}' })
  details: {
    automaticChange?: boolean;
    systemGenerated?: boolean;
    batchOperation?: boolean;
    validationErrors?: string[];
    processingTime?: number;
    apiResponse?: any;
    customerFeedback?: {
      rating?: number;
      comment?: string;
    };
    adminNotes?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'IP address of the user making change' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the user making change' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Session identifier' })
  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @ApiProperty({ description: 'Source of the change' })
  @Column({
    default: 'manual',
    type: 'varchar',
    length: '50',
    enum: ['manual', 'automatic', 'api', 'batch', 'scheduled'],
  })
  source: 'manual' | 'automatic' | 'api' | 'batch' | 'scheduled';

  @ApiProperty({ description: 'Change timestamp' })
  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  // Relations
  @ManyToOne(() => AiRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: AiRequest;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  user?: User;

  // Helper methods
  get isStatusChange(): boolean {
    return this.changeType === ChangeType.STATUS_CHANGE;
  }

  get isSystemGenerated(): boolean {
    return (
      this.details?.systemGenerated ||
      this.source === 'automatic' ||
      this.source === 'scheduled'
    );
  }

  get hasUserFeedback(): boolean {
    return (
      this.changeType === ChangeType.CUSTOMER_FEEDBACK &&
      !!this.details?.customerFeedback
    );
  }

  get changeDescription(): string {
    switch (this.changeType) {
      case ChangeType.STATUS_CHANGE:
        return `Status changed from ${this.previousStatus} to ${this.newStatus}`;
      case ChangeType.ASSIGNMENT_CHANGE:
        return `Assignment changed`;
      case ChangeType.PRIORITY_CHANGE:
        return `Priority changed`;
      case ChangeType.CONTENT_UPDATE:
        return `Content updated`;
      case ChangeType.NOTES_UPDATE:
        return `Notes updated`;
      case ChangeType.COST_UPDATE:
        return `Cost information updated`;
      case ChangeType.EXPIRY_UPDATE:
        return `Expiry date updated`;
      case ChangeType.RETRY_ATTEMPT:
        return `Retry attempt made`;
      case ChangeType.REVISION_REQUEST:
        return `Revision requested`;
      case ChangeType.CUSTOMER_FEEDBACK:
        return `Customer feedback received`;
      default:
        return `Change made: ${this.changeType}`;
    }
  }

  constructor(partial: Partial<AiRequestHistory>) {
    Object.assign(this, {
      changedByRole: 'admin',
      details: {},
      source: 'manual',
      ...partial,
    });
  }
}
