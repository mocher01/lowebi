import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Base AI Queue Tables Creation Migration
 * Creates all necessary tables for the AI Queue Management System
 */
export class CreateAiQueueTables1755574000000 implements MigrationInterface {
  name = 'CreateAiQueueTables1755574000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Creating AI Queue tables...');

    // Create request_type enum
    await queryRunner.query(`
            CREATE TYPE request_type_enum AS ENUM (
                'content', 'services', 'hero', 'about', 'testimonials', 
                'faq', 'seo', 'blog', 'contact', 'custom'
            )
        `);

    // Create request_status enum
    await queryRunner.query(`
            CREATE TYPE request_status_enum AS ENUM (
                'pending', 'assigned', 'processing', 'completed', 
                'rejected', 'cancelled', 'failed'
            )
        `);

    // Create ai_requests table
    await queryRunner.query(`
            CREATE TABLE ai_requests (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                site_id VARCHAR NOT NULL,
                request_type request_type_enum NOT NULL,
                business_type VARCHAR NOT NULL,
                terminology TEXT,
                status request_status_enum NOT NULL DEFAULT 'pending',
                priority VARCHAR(50) DEFAULT 'normal',
                admin_id INTEGER,
                request_data JSONB NOT NULL,
                generated_content JSONB,
                processing_notes TEXT,
                admin_comments TEXT,
                wizard_session_id VARCHAR,
                estimated_cost DECIMAL(10,4) DEFAULT 0,
                actual_cost DECIMAL(10,4),
                revision_count INTEGER DEFAULT 0,
                customer_rating INTEGER,
                customer_feedback TEXT,
                processing_duration INTEGER,
                error_message TEXT,
                retry_count INTEGER DEFAULT 0,
                expires_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                assigned_at TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

    // Create admin_activity_log table
    await queryRunner.query(`
            CREATE TABLE admin_activity_log (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER NOT NULL,
                action VARCHAR NOT NULL,
                target_type VARCHAR NOT NULL,
                target_id INTEGER NOT NULL,
                details JSONB DEFAULT '{}',
                ip_address VARCHAR,
                user_agent TEXT,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

    // Create ai_request_history table
    await queryRunner.query(`
            CREATE TABLE ai_request_history (
                id SERIAL PRIMARY KEY,
                request_id INTEGER NOT NULL,
                previous_status request_status_enum,
                new_status request_status_enum NOT NULL,
                changed_by INTEGER NOT NULL,
                change_reason TEXT,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (request_id) REFERENCES ai_requests(id) ON DELETE CASCADE
            )
        `);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_customer ON ai_requests(customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_status ON ai_requests(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_type ON ai_requests(request_type)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_admin ON ai_requests(admin_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_requests_created ON ai_requests(created_at)`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_activity_log_admin ON admin_activity_log(admin_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_activity_log_timestamp ON admin_activity_log(timestamp)`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_request_history_request ON ai_request_history(request_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_request_history_timestamp ON ai_request_history(timestamp)`,
    );

    console.log('✅ AI Queue tables created successfully');
    console.log('   - ai_requests table with 25 columns');
    console.log('   - admin_activity_log table');
    console.log('   - ai_request_history table');
    console.log('   - 8 performance indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Dropping AI Queue tables...');

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_request_history_timestamp`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_request_history_request`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_activity_log_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_activity_log_admin`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_admin`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_requests_customer`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS ai_request_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin_activity_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_requests`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS request_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS request_type_enum`);

    console.log('✅ AI Queue tables dropped');
  }
}
