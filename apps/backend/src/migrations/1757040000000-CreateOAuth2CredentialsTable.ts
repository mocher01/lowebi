import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuth2CredentialsTable1757040000000
  implements MigrationInterface
{
  name = 'CreateOAuth2CredentialsTable1757040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create oauth2_credentials table
    await queryRunner.query(`
      CREATE TABLE oauth2_credentials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        wizard_session_id UUID,
        customer_site_id UUID,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'microsoft', 'github')),
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
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_oauth2_user_id ON oauth2_credentials(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_oauth2_wizard_session_id ON oauth2_credentials(wizard_session_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_oauth2_customer_site_id ON oauth2_credentials(customer_site_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_oauth2_email ON oauth2_credentials(email);
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE oauth2_credentials
      ADD CONSTRAINT oauth2_credentials_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE oauth2_credentials
      ADD CONSTRAINT oauth2_credentials_wizard_session_id_fkey
      FOREIGN KEY (wizard_session_id) REFERENCES wizard_sessions(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE oauth2_credentials
      ADD CONSTRAINT oauth2_credentials_customer_site_id_fkey
      FOREIGN KEY (customer_site_id) REFERENCES customer_sites(id) ON DELETE SET NULL;
    `);

    console.log('✅ OAuth2 credentials table created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE oauth2_credentials DROP CONSTRAINT IF EXISTS oauth2_credentials_customer_site_id_fkey;
    `);

    await queryRunner.query(`
      ALTER TABLE oauth2_credentials DROP CONSTRAINT IF EXISTS oauth2_credentials_wizard_session_id_fkey;
    `);

    await queryRunner.query(`
      ALTER TABLE oauth2_credentials DROP CONSTRAINT IF EXISTS oauth2_credentials_user_id_fkey;
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_oauth2_email;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_oauth2_customer_site_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_oauth2_wizard_session_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_oauth2_user_id;
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS oauth2_credentials CASCADE;
    `);

    console.log('✅ OAuth2 credentials table dropped successfully');
  }
}
