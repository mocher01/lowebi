import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('customer_settings')
export class CustomerSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({
    type: 'text',
    default: '{"email": true, "sms": false, "push": true}',
  })
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @Column({
    type: 'text',
    default: '{"mode": "system", "primaryColor": "#3b82f6"}',
  })
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
  };

  @Column({ default: 'en' })
  language: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'text', default: '{}' })
  preferences: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  constructor(partial: Partial<CustomerSettings>) {
    Object.assign(this, partial);
  }
}
