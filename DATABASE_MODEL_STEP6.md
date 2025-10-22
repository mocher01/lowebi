# Database Model for Step 6 OAuth2 Implementation

## Current Database Model Summary

**Total Entities**: 17 across 3 modules

### Auth Module (3 entities)
1. **User** - Core user table (customers + admins)
2. **Session** - JWT sessions with refresh tokens
3. **VerificationToken** - Password reset & email verification

### Customer Module (9 entities)
1. **Customer** - Customer profile & billing info
2. **CustomerSettings** - UI preferences
3. **CustomerSite** - Deployed websites (permanent)
4. **CustomerUsage** - Resource usage tracking
5. **CustomerActivity** - Activity logs
6. **CustomerSubscription** - Stripe subscriptions
7. **CustomerTemplate** - Available templates
8. **WizardSession** - NEW wizard system (V2) ⭐ **KEY FOR STEP 6**
9. **WebsiteWizardSession** - OLD wizard system (V1 legacy)

### Admin Module (5 entities)
1. **AiRequest** - AI generation queue
2. **AiRequestHistory** - Change tracking
3. **SiteAnalytics** - Site traffic data
4. **AdminActivityLog** - Admin action logs
5. **AuditLog** - Security audit trail

---

## Key Entities for Step 6 Implementation

### 🎯 PRIMARY: WizardSession (wizard_sessions)

**Current Structure**:
```typescript
@Entity('wizard_sessions')
export class WizardSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ unique: true })
  sessionId: string;

  @Column()
  siteName: string;

  @Column()
  domain: string;

  @Column({ default: 0 })
  currentStep: number;

  @Column({ nullable: true })
  businessType: string;

  @Column({ default: 0 })
  progressPercentage: number;

  // ⭐ JSONB - stores ALL wizard data including Step 6
  @Column({ type: 'jsonb', default: {} })
  wizardData: any;

  // JSONB - stores AI request metadata
  @Column({ type: 'jsonb', default: {} })
  aiRequests: any;

  @Column({
    type: 'enum',
    enum: WizardSessionStatus,
    default: WizardSessionStatus.ACTIVE
  })
  status: WizardSessionStatus;

  @Column({ type: 'timestamp' })
  lastAccessedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

enum WizardSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}
```

**Current wizardData.step6 Structure** (from frontend):
```typescript
wizardData: {
  // ... steps 0-5 data
  step6: {
    emailConfig: {
      scenario: 'oauth2' | 'locodai-default' | 'no-form',

      // OAuth2 Gmail (Scenario A)
      oauth: {
        connected: boolean,
        email: string,
        encryptedAccessToken: string,  // ❗ Currently NOT encrypted!
        encryptedRefreshToken: string, // ❗ Currently NOT encrypted!
        expiresAt: string,
        scopes: string[]
      },

      // Locod.ai Default (Scenario B)
      locodaiDefault: {
        enabled: boolean,
        businessEmail: string,
        gdprConsent: {
          accepted: boolean,
          acceptedAt: string,
          ipAddress: string,
          policyVersion: string
        }
      },

      // No Form (Scenario C)
      noForm: {
        contactInfoOnly: {
          phone: string,
          address: string,
          socialLinks: string[]
        }
      }
    },

    // Feature toggles
    n8n: { enabled: boolean },
    analytics: { enabled: boolean },
    recaptcha: { enabled: boolean }
  }
}
```

---

## 🔧 REQUIRED CHANGES FOR STEP 6

### Option 1: Keep Everything in wizardData (SIMPLEST) ✅ RECOMMENDED

**No schema changes needed!**

Just add encryption at the **service layer**:

```typescript
// wizard-session.service.ts

import { Injectable } from '@nestjs/common';
import { EncryptionService } from '@/common/services/encryption.service';

@Injectable()
export class WizardSessionService {
  constructor(
    private encryptionService: EncryptionService,
    // ...
  ) {}

  async updateSession(sessionId: string, updateDto: UpdateWizardSessionDto) {
    const session = await this.getSession(sessionId);

    // Encrypt OAuth2 tokens if present
    if (updateDto.wizardData?.step6?.emailConfig?.oauth) {
      const oauth = updateDto.wizardData.step6.emailConfig.oauth;

      if (oauth.accessToken) {
        oauth.encryptedAccessToken = await this.encryptionService.encrypt(
          oauth.accessToken
        );
        delete oauth.accessToken; // Remove plaintext
      }

      if (oauth.refreshToken) {
        oauth.encryptedRefreshToken = await this.encryptionService.encrypt(
          oauth.refreshToken
        );
        delete oauth.refreshToken; // Remove plaintext
      }
    }

    session.wizardData = { ...session.wizardData, ...updateDto.wizardData };
    return await this.wizardSessionRepository.save(session);
  }
}
```

**Pros**:
- ✅ Zero schema changes
- ✅ Simple to implement
- ✅ Keeps all wizard data in one place
- ✅ Easy to debug with JSONB queries

**Cons**:
- ❌ Tokens mixed with non-sensitive data in JSONB
- ❌ Harder to audit token access
- ❌ No database-level encryption (app-level only)

---

### Option 2: Separate OAuth2 Credentials Table (MOST SECURE) 🔐

**Add new entity**:

```typescript
@Entity('oauth2_credentials')
export class OAuth2Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'wizard_session_id', nullable: true })
  @Index()
  wizardSessionId: string;

  @Column({ name: 'customer_site_id', nullable: true })
  @Index()
  customerSiteId: string;

  @Column({
    type: 'enum',
    enum: OAuth2Provider
  })
  provider: OAuth2Provider; // GOOGLE, MICROSOFT, etc.

  @Column()
  email: string;

  // Encrypted fields (at rest)
  @Column({ type: 'text' })
  encryptedAccessToken: string;

  @Column({ type: 'text' })
  encryptedRefreshToken: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'json' })
  scopes: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WizardSession, { nullable: true })
  @JoinColumn({ name: 'wizard_session_id' })
  wizardSession: WizardSession;

  @ManyToOne(() => CustomerSite, { nullable: true })
  @JoinColumn({ name: 'customer_site_id' })
  customerSite: CustomerSite;
}

enum OAuth2Provider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github'
}
```

**wizardData.step6 would only store reference**:

```typescript
wizardData: {
  step6: {
    emailConfig: {
      scenario: 'oauth2',
      oauthCredentialId: 'uuid-here', // Reference only
      email: 'user@gmail.com' // Display info only
    }
  }
}
```

**Migration needed**:

```sql
CREATE TABLE oauth2_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wizard_session_id UUID REFERENCES wizard_sessions(id) ON DELETE SET NULL,
  customer_site_id UUID REFERENCES customer_sites(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  scopes JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_oauth2_user_id ON oauth2_credentials(user_id);
CREATE INDEX idx_oauth2_wizard_session_id ON oauth2_credentials(wizard_session_id);
CREATE INDEX idx_oauth2_customer_site_id ON oauth2_credentials(customer_site_id);
CREATE INDEX idx_oauth2_email ON oauth2_credentials(email);
```

**Pros**:
- ✅ Strongest security (separate table for sensitive data)
- ✅ Easy to audit token access
- ✅ Can revoke tokens independently
- ✅ Reusable across multiple sites
- ✅ Can add database-level encryption
- ✅ Separate backup strategy for credentials
- ✅ Clear audit trail per credential

**Cons**:
- ❌ Requires schema migration
- ❌ More complex queries (JOIN needed)
- ❌ Additional entity management

---

### Option 3: Hybrid (BALANCED) ⚖️

**Add OAuth2 table for production, keep in wizardData during wizard**:

```typescript
// During wizard (temporary)
wizardData.step6.emailConfig.oauth = {
  connected: true,
  email: 'user@gmail.com',
  // Tokens encrypted but stored in JSONB
  encryptedAccessToken: '...',
  encryptedRefreshToken: '...'
}

// After deployment (permanent)
// Move to oauth2_credentials table
// wizardData.step6.emailConfig.oauthCredentialId = 'uuid'
```

**Pros**:
- ✅ Secure production storage
- ✅ Simple during wizard (no extra queries)
- ✅ Clean separation of concerns

**Cons**:
- ❌ Data migration on wizard completion
- ❌ Two storage locations to manage

---

## 📐 RECOMMENDATION

### For Step 6 Implementation: **Option 2 (Separate Table)** 🏆

**Rationale**:
1. **Security**: OAuth2 tokens are highly sensitive credentials
2. **Compliance**: GDPR/SOC2 require proper credential handling
3. **Scalability**: User might connect same Gmail to multiple sites
4. **Auditability**: Clear trail of token usage and revocation
5. **Flexibility**: Easy to add more OAuth providers later (Microsoft, GitHub)

**Implementation Plan**:

1. **Create Migration**:
```bash
npm run migration:create -- CreateOAuth2CredentialsTable
```

2. **Create Entity**:
`apps/backend/src/auth/entities/oauth2-credential.entity.ts`

3. **Create Service**:
`apps/backend/src/auth/services/oauth2.service.ts`
- Handle Google OAuth flow
- Encrypt/decrypt tokens
- Refresh expired tokens
- Revoke tokens

4. **Create Controller**:
`apps/backend/src/customer/controllers/oauth2.controller.ts`
- POST /customer/oauth2/authorize
- GET /customer/oauth2/callback
- POST /customer/oauth2/revoke
- GET /customer/oauth2/status

5. **Update WizardSessionService**:
- When user completes OAuth2 flow, create OAuth2Credential
- Store reference ID in wizardData.step6.emailConfig.oauthCredentialId
- On wizard completion, link OAuth2Credential to CustomerSite

6. **Update CustomerSite**:
- Add relationship to OAuth2Credential
- Transform step6 data properly on deployment

---

## 🔐 Encryption Strategy

### Use NestJS ConfigService + crypto module:

```typescript
// apps/backend/src/common/services/encryption.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    // Load from environment variable
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyString || keyString.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    this.key = Buffer.from(keyString, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

**Environment Setup**:
```bash
# .env
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-key-here
```

---

## 📊 Updated CustomerSite Structure

After wizard completion, `customer_sites.site_config` should look like:

```typescript
customer_sites {
  site_config: {
    // NO "step6" terminology in production!
    email: {
      provider: 'oauth2-gmail' | 'locodai-default' | 'none',
      oauthCredentialId: 'uuid', // Reference to oauth2_credentials table
      connectedEmail: 'user@gmail.com',
      locodaiBusinessEmail: 'business@example.com', // If using Locod.ai
      gdprConsent: { ... } // If using Locod.ai
    },
    features: {
      n8n: {
        enabled: true,
        webhookUrl: 'https://n8n.locod-ai.com/webhook/...'
      },
      analytics: {
        enabled: true,
        provider: 'google-analytics',
        trackingId: 'G-XXXXXXXXXX'
      },
      recaptcha: {
        enabled: true,
        siteKey: 'reCAPTCHA site key'
      }
    },
    branding: { ... },
    seo: { ... }
  }
}
```

---

## ✅ Summary

**Current State**:
- ✅ WizardSession stores step6 data in JSONB
- ❌ OAuth2 tokens NOT encrypted
- ❌ No separate credentials table
- ❌ Wizard terminology leaks to production

**Required Changes**:
1. ✅ Create `oauth2_credentials` table
2. ✅ Implement EncryptionService
3. ✅ Create OAuth2Service for Google OAuth flow
4. ✅ Update WizardSessionService to create credentials
5. ✅ Transform step6 → production config on deployment
6. ✅ Link OAuth2Credential to CustomerSite

**Next Steps**:
1. Create migration for `oauth2_credentials`
2. Implement encryption service
3. Implement OAuth2 service
4. Create OAuth2 controller
5. Test OAuth flow end-to-end
6. Update wizard completion to transform data

---

**Do you want me to start implementing Option 2 (Separate OAuth2 Credentials Table)?**
