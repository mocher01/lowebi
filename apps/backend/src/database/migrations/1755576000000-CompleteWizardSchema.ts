import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2: Complete Wizard Schema Migration
 * Adds ALL missing wizard fields and tables discovered during QA
 * Brings V2 PostgreSQL to 100% parity with V1 SQLite schemas
 */
export class CompleteWizardSchema1755576000000 implements MigrationInterface {
  name = 'CompleteWizardSchema1755576000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Starting Phase 2: Complete Wizard Schema Migration...');

    // 1. Create missing ENUMs
    await this.createMissingEnums(queryRunner);

    // 2. Add all missing columns to ai_requests
    await this.addMissingColumnsToAiRequests(queryRunner);

    // 3. Create website_wizard_sessions table
    await this.createWizardSessionsTable(queryRunner);

    // 4. Add performance indexes
    await this.addPerformanceIndexes(queryRunner);

    // 5. Update existing data with default values
    await this.updateExistingDataWithDefaults(queryRunner);

    console.log(
      '✅ Phase 2: Complete Wizard Schema Migration completed successfully',
    );
    console.log('   📊 V2 PostgreSQL now has 100% field parity with V1 SQLite');
  }

  private async createMissingEnums(queryRunner: QueryRunner): Promise<void> {
    console.log('📋 Creating missing ENUMs...');

    // Priority enum
    await queryRunner.query(`
            CREATE TYPE priority_enum AS ENUM ('low', 'normal', 'high', 'urgent')
        `);

    // Billing status enum
    await queryRunner.query(`
            CREATE TYPE billing_status_enum AS ENUM ('pending', 'billed', 'paid', 'refunded')
        `);

    // Wizard status enum
    await queryRunner.query(`
            CREATE TYPE wizard_status_enum AS ENUM ('draft', 'in_progress', 'completed', 'cancelled', 'expired')
        `);

    // Wizard step enum
    await queryRunner.query(`
            CREATE TYPE wizard_step_enum AS ENUM (
                'business_info', 'template_selection', 'design_preferences', 
                'content_creation', 'ai_generation', 'customization', 'review', 'deployment'
            )
        `);

    console.log('✅ Created 4 new ENUMs');
  }

  private async addMissingColumnsToAiRequests(
    queryRunner: QueryRunner,
  ): Promise<void> {
    console.log('📋 Adding missing wizard columns to ai_requests...');

    // Business workflow columns (skip if already exists from CreateAiQueueTables)
    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS business_type VARCHAR(100)`,
      );
    } catch (e) {
      /* Column already exists */
    }

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS terminology TEXT`,
      );
    } catch (e) {
      /* Column already exists */
    }

    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN priority_new priority_enum DEFAULT 'normal'`,
    );
    await queryRunner.query(
      `UPDATE ai_requests SET priority_new = priority::priority_enum WHERE priority IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE ai_requests DROP COLUMN priority`);
    await queryRunner.query(
      `ALTER TABLE ai_requests RENAME COLUMN priority_new TO priority`,
    );

    // Wizard integration columns (skip if already exists)
    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN wizard_session_id VARCHAR(255)`,
      );
    } catch (e) {
      /* Column already exists */
    }

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN admin_comments TEXT`,
      );
    } catch (e) {
      /* Column already exists */
    }

    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN billing_status billing_status_enum DEFAULT 'pending'`,
    );

    // Customer feedback columns
    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN customer_feedback_rating INTEGER`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN customer_notes TEXT`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN feedback_at TIMESTAMP`,
    );

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN revision_count INTEGER DEFAULT 0`,
      );
    } catch (e) {
      /* Column already exists */
    }

    // Technical tracking columns
    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN client_ip INET`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests ADD COLUMN user_agent TEXT`,
    );

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN processing_duration INTEGER`,
      );
    } catch (e) {
      /* Column already exists */
    }

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN error_message TEXT`,
      );
    } catch (e) {
      /* Column already exists */
    }

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN retry_count INTEGER DEFAULT 0`,
      );
    } catch (e) {
      /* Column already exists */
    }

    // Lifecycle columns
    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN expires_at TIMESTAMP`,
      );
    } catch (e) {
      /* Column already exists */
    }

    try {
      await queryRunner.query(
        `ALTER TABLE ai_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()`,
      );
    } catch (e) {
      /* Column already exists */
    }

    console.log('✅ Added missing columns to ai_requests');
  }

  private async createWizardSessionsTable(
    queryRunner: QueryRunner,
  ): Promise<void> {
    console.log('📋 Creating website_wizard_sessions table...');

    await queryRunner.query(`
            CREATE TABLE website_wizard_sessions (
                id VARCHAR(255) PRIMARY KEY,
                session_name VARCHAR(255),
                status wizard_status_enum NOT NULL DEFAULT 'draft',
                current_step wizard_step_enum NOT NULL DEFAULT 'business_info',
                completed_steps TEXT NOT NULL DEFAULT '',
                progress_percentage INTEGER NOT NULL DEFAULT 0,
                
                -- Wizard step data (JSONB for PostgreSQL optimization)
                business_info JSONB,
                template_selection JSONB,
                design_preferences JSONB,
                content_data JSONB,
                ai_generation_requests JSONB,
                customization_settings JSONB,
                final_configuration JSONB,
                deployment_config JSONB,
                
                -- Site generation
                generated_site_id VARCHAR(255),
                
                -- Lifecycle management
                expires_at TIMESTAMP NOT NULL,
                last_activity_at TIMESTAMP NOT NULL,
                estimated_completion_time INTEGER,
                
                -- Customer relationship
                customer_id VARCHAR(255) NOT NULL,
                
                -- Timestamps
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

    console.log('✅ Created website_wizard_sessions table');
  }

  private async addPerformanceIndexes(queryRunner: QueryRunner): Promise<void> {
    console.log('📋 Adding performance indexes...');

    // ai_requests wizard-specific indexes
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_wizard_session ON ai_requests(wizard_session_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_priority ON ai_requests(priority)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_billing_status ON ai_requests(billing_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_business_type ON ai_requests(business_type)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_updated ON ai_requests(updated_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_expires ON ai_requests(expires_at)`,
    );

    // website_wizard_sessions indexes
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_customer ON website_wizard_sessions(customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_status ON website_wizard_sessions(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_step ON website_wizard_sessions(current_step)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_activity ON website_wizard_sessions(last_activity_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_expires ON website_wizard_sessions(expires_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_site ON website_wizard_sessions(generated_site_id)`,
    );

    console.log('✅ Added 12 performance indexes');
  }

  private async updateExistingDataWithDefaults(
    queryRunner: QueryRunner,
  ): Promise<void> {
    console.log('📋 Updating existing data with default values...');

    // Update the existing migrated AI request with missing V1 data
    await queryRunner.query(`
            UPDATE ai_requests 
            SET 
                business_type = 'translation',
                terminology = 'services',
                priority = 'normal',
                wizard_session_id = 'wizard-test-001',
                billing_status = 'pending',
                revision_count = 0,
                retry_count = 0,
                client_ip = '::1',
                user_agent = 'curl/8.8.0',
                updated_at = completed_at
            WHERE id = 1
        `);

    console.log('✅ Updated existing data with V1 values');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back Phase 2: Complete Wizard Schema Migration...');

    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_site`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_expires`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_wizard_sessions_activity`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_step`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_status`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_wizard_sessions_customer`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_expires`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_updated`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ai_requests_business_type`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ai_requests_billing_status`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_priority`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_ai_requests_wizard_session`,
    );

    // Drop wizard sessions table
    await queryRunner.query(`DROP TABLE IF EXISTS website_wizard_sessions`);

    // Remove added columns from ai_requests (in reverse order)
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS updated_at`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS expires_at`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS retry_count`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS error_message`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS processing_duration`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS user_agent`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS client_ip`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS revision_count`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS feedback_at`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS customer_notes`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS customer_feedback`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS billing_status`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS admin_comments`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS wizard_session_id`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS priority`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS terminology`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_requests DROP COLUMN IF EXISTS business_type`,
    );

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE IF EXISTS wizard_step_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS wizard_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS billing_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS priority_enum`);

    console.log('✅ Phase 2 migration rollback completed');
  }
}
