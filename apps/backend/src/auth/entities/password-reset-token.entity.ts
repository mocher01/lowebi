import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum TokenType {
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

@Entity('verification_tokens')
@Index(['token'])
@Index(['userId', 'type'])
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'token_type',
  })
  type: TokenType;

  @Column({
    type: 'varchar',
    length: 500,
    unique: true,
  })
  token: string;

  @Column({
    name: 'expires_at',
  })
  expiresAt: Date;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_used',
  })
  isUsed: boolean;

  @Column({
    nullable: true,
    name: 'used_at',
  })
  usedAt?: Date;

  @Column({
    nullable: true,
    name: 'ip_address',
  })
  ipAddress?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'user_agent',
  })
  userAgent?: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  constructor(partial: Partial<VerificationToken> = {}) {
    Object.assign(this, partial);
  }
}
