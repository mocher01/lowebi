import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSiteDomainsTable1755579000000 implements MigrationInterface {
  name = 'CreateSiteDomainsTable1755579000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Creating site_domains table...');

    // Create domain type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE site_domain_type_enum AS ENUM ('subdomain', 'custom');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create domain status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE site_domain_status_enum AS ENUM ('pending', 'active', 'failed', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create SSL status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE site_domain_ssl_status_enum AS ENUM ('pending', 'issued', 'failed', 'expiring');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create site_domains table
    await queryRunner.query(`
      CREATE TABLE site_domains (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wizard_session_id UUID NOT NULL,

        -- Domain info
        domain VARCHAR(255) NOT NULL UNIQUE,
        domain_type site_domain_type_enum NOT NULL,
        is_temporary BOOLEAN DEFAULT FALSE,

        -- Status tracking
        status site_domain_status_enum NOT NULL DEFAULT 'pending',

        -- Verification (custom domains only)
        verification_token VARCHAR(255),
        verification_method VARCHAR(50) DEFAULT 'txt',
        verification_expires_at TIMESTAMP WITH TIME ZONE,
        verified_at TIMESTAMP WITH TIME ZONE,

        -- SSL tracking
        ssl_status site_domain_ssl_status_enum DEFAULT 'pending',
        ssl_expires_at TIMESTAMP WITH TIME ZONE,

        -- Infrastructure
        nginx_config_path VARCHAR(500),
        container_name VARCHAR(255),

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        activated_at TIMESTAMP WITH TIME ZONE,
        last_checked_at TIMESTAMP WITH TIME ZONE,

        -- Error tracking
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,

        FOREIGN KEY (wizard_session_id) REFERENCES wizard_sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_site_domains_domain ON site_domains(domain)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_site_domains_wizard_session ON site_domains(wizard_session_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_site_domains_status ON site_domains(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_site_domains_type ON site_domains(domain_type)`,
    );

    // Add active_domain_id to wizard_sessions table
    await queryRunner.query(`
      ALTER TABLE wizard_sessions
      ADD COLUMN active_domain_id UUID,
      ADD CONSTRAINT fk_wizard_sessions_active_domain
        FOREIGN KEY (active_domain_id)
        REFERENCES site_domains(id)
        ON DELETE SET NULL
    `);

    console.log('✅ site_domains table created successfully');
    console.log('   - site_domains table with 19 columns');
    console.log('   - 4 performance indexes (1 unique)');
    console.log('   - Foreign key constraint to wizard_sessions');
    console.log('   - active_domain_id added to wizard_sessions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Dropping site_domains table...');

    // Remove active_domain_id from wizard_sessions
    await queryRunner.query(`
      ALTER TABLE wizard_sessions
      DROP CONSTRAINT IF EXISTS fk_wizard_sessions_active_domain,
      DROP COLUMN IF EXISTS active_domain_id
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_domains_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_domains_status`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_site_domains_wizard_session`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_domains_domain`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS site_domains`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS site_domain_ssl_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS site_domain_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS site_domain_type_enum`);

    console.log('✅ site_domains table dropped successfully');
  }
}
