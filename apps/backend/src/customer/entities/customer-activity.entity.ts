import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  SITE_CREATED = 'site_created',
  SITE_UPDATED = 'site_updated',
  SITE_DELETED = 'site_deleted',
  PROFILE_UPDATED = 'profile_updated',
  SETTINGS_UPDATED = 'settings_updated',
  PASSWORD_CHANGED = 'password_changed',
}

@Entity('customer_activities')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
export class CustomerActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: '50',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  constructor(partial: Partial<CustomerActivity>) {
    Object.assign(this, partial);
  }
}
