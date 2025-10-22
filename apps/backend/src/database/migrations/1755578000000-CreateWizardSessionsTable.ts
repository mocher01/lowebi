import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWizardSessionsTable1755578000000
  implements MigrationInterface
{
  name = 'CreateWizardSessionsTable1755578000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Creating wizard_sessions table...');

    // Create wizard session status enum first
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE wizard_session_status_enum AS ENUM ('active', 'completed', 'abandoned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create wizard_sessions table
    await queryRunner.query(`
      CREATE TABLE wizard_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        site_name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        current_step INTEGER DEFAULT 0,
        business_type VARCHAR(100),
        progress_percentage INTEGER DEFAULT 0,
        wizard_data JSONB,
        ai_requests JSONB,
        status wizard_session_status_enum DEFAULT 'active',
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_user_id ON wizard_sessions(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_session_id ON wizard_sessions(session_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_status ON wizard_sessions(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_wizard_sessions_last_accessed ON wizard_sessions(last_accessed_at)`,
    );

    console.log('✅ wizard_sessions table created successfully');
    console.log('   - wizard_sessions table with 14 columns');
    console.log('   - 4 performance indexes');
    console.log('   - Foreign key constraint to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Dropping wizard_sessions table...');

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_wizard_sessions_last_accessed`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_status`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_wizard_sessions_session_id`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wizard_sessions_user_id`);

    // Drop table (foreign key drops automatically)
    await queryRunner.query(`DROP TABLE IF EXISTS wizard_sessions`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS wizard_session_status_enum`);

    console.log('✅ wizard_sessions table dropped successfully');
  }
}
