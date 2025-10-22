import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum AuditAction {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_PASSWORD_RESET = 'user_password_reset',
  SESSION_TERMINATED = 'session_terminated',
  BULK_SESSION_TERMINATED = 'bulk_session_terminated',
  DASHBOARD_ACCESSED = 'dashboard_accessed',
  USER_LIST_ACCESSED = 'user_list_accessed',
  USER_DETAILS_ACCESSED = 'user_details_accessed',
  SITE_CREATED = 'site_created',
  SITE_UPDATED = 'site_updated',
  SITE_DELETED = 'site_deleted',
  SITE_DEPLOYED = 'site_deployed',
  SITE_BULK_OPERATION = 'site_bulk_operation',
  SITE_LIST_ACCESSED = 'site_list_accessed',
  SITE_DETAILS_ACCESSED = 'site_details_accessed',
  SITE_ANALYTICS_ACCESSED = 'site_analytics_accessed',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: AuditAction;

  @Column({ name: 'target_user_id', nullable: true })
  targetUserId?: string;

  @Column({ name: 'target_resource', nullable: true })
  targetResource?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
  }
}
