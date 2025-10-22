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
import { User } from '../../auth/entities/user.entity';

export enum AdminAction {
  // AI Request Actions
  AI_REQUEST_ASSIGNED = 'ai_request_assigned',
  AI_REQUEST_STARTED = 'ai_request_started',
  AI_REQUEST_COMPLETED = 'ai_request_completed',
  AI_REQUEST_REJECTED = 'ai_request_rejected',
  AI_REQUEST_CANCELLED = 'ai_request_cancelled',
  AI_REQUEST_PRIORITY_CHANGED = 'ai_request_priority_changed',
  AI_REQUEST_NOTES_UPDATED = 'ai_request_notes_updated',

  // Customer Management Actions
  CUSTOMER_PROFILE_VIEWED = 'customer_profile_viewed',
  CUSTOMER_PROFILE_UPDATED = 'customer_profile_updated',
  CUSTOMER_STATUS_CHANGED = 'customer_status_changed',
  CUSTOMER_TIER_CHANGED = 'customer_tier_changed',
  CUSTOMER_DELETED = 'customer_deleted',
  CUSTOMER_SUSPENDED = 'customer_suspended',
  CUSTOMER_ACTIVATED = 'customer_activated',

  // Site Management Actions
  SITE_CREATED = 'site_created',
  SITE_UPDATED = 'site_updated',
  SITE_DELETED = 'site_deleted',
  SITE_DEPLOYED = 'site_deployed',
  SITE_STATUS_CHANGED = 'site_status_changed',
  SITE_BULK_OPERATION = 'site_bulk_operation',

  // System Actions
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  DASHBOARD_ACCESSED = 'dashboard_accessed',
  SETTINGS_UPDATED = 'settings_updated',
  SYSTEM_BACKUP_CREATED = 'system_backup_created',
  SYSTEM_MAINTENANCE = 'system_maintenance',

  // Queue Management
  QUEUE_BULK_ASSIGN = 'queue_bulk_assign',
  QUEUE_BULK_COMPLETE = 'queue_bulk_complete',
  QUEUE_BULK_REJECT = 'queue_bulk_reject',
  QUEUE_FILTER_APPLIED = 'queue_filter_applied',
  QUEUE_EXPORT = 'queue_export',

  // Content Management
  CONTENT_REVIEWED = 'content_reviewed',
  CONTENT_APPROVED = 'content_approved',
  CONTENT_REVISION_REQUESTED = 'content_revision_requested',
  TEMPLATE_CREATED = 'template_created',
  TEMPLATE_UPDATED = 'template_updated',
  TEMPLATE_DELETED = 'template_deleted',
}

export enum TargetType {
  AI_REQUEST = 'ai_request',
  CUSTOMER = 'customer',
  SITE = 'site',
  USER = 'user',
  TEMPLATE = 'template',
  SYSTEM = 'system',
  QUEUE = 'queue',
  CONTENT = 'content',
}

@Entity({ name: 'activity_logs' })
@Index(['adminId', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['targetType', 'targetId'])
@Index(['timestamp'])
export class AdminActivityLog {
  @ApiProperty({ description: 'Unique activity log identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Admin user who performed the action' })
  @Column({ name: 'admin_id' })
  adminId: string;

  @ApiProperty({ description: 'Action performed by admin', enum: AdminAction })
  @Column({
    type: 'varchar',
    length: '50',
    enum: AdminAction,
  })
  action: AdminAction;

  @ApiProperty({ description: 'Type of target entity', enum: TargetType })
  @Column({
    name: 'target_type',
    type: 'varchar',
    length: '50',
    enum: TargetType,
  })
  targetType: TargetType;

  @ApiProperty({ description: 'ID of the target entity' })
  @Column({ name: 'target_id' })
  targetId: string;

  @ApiProperty({ description: 'Optional target entity description' })
  @Column({ name: 'target_description', nullable: true })
  targetDescription?: string;

  @ApiProperty({ description: 'Additional details about the action' })
  @Column({ type: 'text', default: '{}' })
  details: {
    previousValue?: any;
    newValue?: any;
    reason?: string;
    batchSize?: number;
    filters?: any;
    duration?: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: any;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Admin IP address' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'Admin user agent' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Session ID for grouping related actions' })
  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @ApiProperty({ description: 'Request ID for API tracing' })
  @Column({ name: 'request_id', nullable: true })
  requestId?: string;

  @ApiProperty({ description: 'Severity level of the action' })
  @Column({
    default: 'info',
    type: 'varchar',
    length: '50',
    enum: ['debug', 'info', 'warning', 'error', 'critical'],
  })
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty({ description: 'Action execution duration in milliseconds' })
  @Column({ name: 'execution_duration', nullable: true })
  executionDuration?: number;

  @ApiProperty({ description: 'Whether the action was successful' })
  @Column({ name: 'success', default: true })
  success: boolean;

  @ApiProperty({ description: 'Error details if action failed' })
  @Column({ name: 'error_details', type: 'text', nullable: true })
  errorDetails?: string;

  @ApiProperty({ description: 'Action timestamp' })
  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  // Helper methods
  get isRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.timestamp > oneHourAgo;
  }

  get isError(): boolean {
    return (
      this.severity === 'error' || this.severity === 'critical' || !this.success
    );
  }

  constructor(partial: Partial<AdminActivityLog>) {
    Object.assign(this, {
      details: {},
      severity: 'info',
      success: true,
      ...partial,
    });
  }
}
