import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WizardSession } from './wizard-session.entity';

export enum DomainType {
  SUBDOMAIN = 'subdomain',
  CUSTOM = 'custom',
}

export enum DomainStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum SslStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  FAILED = 'failed',
  EXPIRING = 'expiring',
}

@Entity('site_domains')
@Index(['domain'], { unique: true })
@Index(['wizardSessionId'])
@Index(['status'])
@Index(['domainType'])
export class SiteDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wizard_session_id', type: 'uuid' })
  wizardSessionId: string;

  // Domain info
  @Column({ unique: true })
  domain: string;

  @Column({
    name: 'domain_type',
    type: 'enum',
    enum: DomainType,
  })
  domainType: DomainType;

  @Column({ name: 'is_temporary', default: false })
  isTemporary: boolean;

  // Status tracking
  @Column({
    type: 'enum',
    enum: DomainStatus,
    default: DomainStatus.PENDING,
  })
  status: DomainStatus;

  // Verification (custom domains only)
  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'verification_method', default: 'txt', nullable: true })
  verificationMethod?: string;

  @Column({
    name: 'verification_expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  verificationExpiresAt?: Date;

  @Column({
    name: 'verified_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  verifiedAt?: Date;

  // SSL tracking
  @Column({
    name: 'ssl_status',
    type: 'enum',
    enum: SslStatus,
    default: SslStatus.PENDING,
    nullable: true,
  })
  sslStatus?: SslStatus;

  @Column({
    name: 'ssl_expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  sslExpiresAt?: Date;

  // Infrastructure
  @Column({ name: 'nginx_config_path', nullable: true })
  nginxConfigPath?: string;

  @Column({ name: 'container_name', nullable: true })
  containerName?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'activated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  activatedAt?: Date;

  @Column({
    name: 'last_checked_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastCheckedAt?: Date;

  // Error tracking
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  // Relations
  @ManyToOne(() => WizardSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizard_session_id' })
  wizardSession: WizardSession;

  // Helper methods
  isActive(): boolean {
    return this.status === DomainStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.status === DomainStatus.PENDING;
  }

  isSubdomain(): boolean {
    return this.domainType === DomainType.SUBDOMAIN;
  }

  isCustomDomain(): boolean {
    return this.domainType === DomainType.CUSTOM;
  }

  isVerified(): boolean {
    return this.verifiedAt !== null && this.verifiedAt !== undefined;
  }

  isVerificationExpired(): boolean {
    if (!this.verificationExpiresAt) return false;
    return new Date() > this.verificationExpiresAt;
  }

  hasSsl(): boolean {
    return this.sslStatus === SslStatus.ISSUED;
  }

  getFullUrl(): string {
    return `https://${this.domain}`;
  }

  toDto() {
    return {
      id: this.id,
      domain: this.domain,
      domainType: this.domainType,
      isTemporary: this.isTemporary,
      status: this.status,
      verificationToken: this.verificationToken,
      verificationExpiresAt: this.verificationExpiresAt,
      verifiedAt: this.verifiedAt,
      sslStatus: this.sslStatus,
      sslExpiresAt: this.sslExpiresAt,
      containerName: this.containerName,
      url: this.getFullUrl(),
      createdAt: this.createdAt,
      activatedAt: this.activatedAt,
      isActive: this.isActive(),
      isPending: this.isPending(),
      isVerified: this.isVerified(),
      hasSsl: this.hasSsl(),
    };
  }
}
