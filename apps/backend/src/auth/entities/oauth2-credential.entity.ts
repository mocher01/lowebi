import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum OAuth2Provider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github',
}

@Entity('oauth2_credentials')
export class OAuth2Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'uuid', name: 'wizard_session_id', nullable: true })
  @Index()
  wizardSessionId: string | null;

  @Column({ type: 'uuid', name: 'customer_site_id', nullable: true })
  @Index()
  customerSiteId: string | null;

  @Column({
    type: 'enum',
    enum: OAuth2Provider,
  })
  provider: OAuth2Provider;

  @Column()
  @Index()
  email: string;

  // Encrypted at rest using AES-256-GCM
  @Column({ type: 'text', name: 'encrypted_access_token' })
  encryptedAccessToken: string;

  @Column({ type: 'text', name: 'encrypted_refresh_token' })
  encryptedRefreshToken: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'json' })
  scopes: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', name: 'last_used_at', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
