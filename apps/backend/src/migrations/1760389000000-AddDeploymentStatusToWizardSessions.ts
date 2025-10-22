import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeploymentStatusToWizardSessions1760389000000
  implements MigrationInterface
{
  name = 'AddDeploymentStatusToWizardSessions1760389000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deployment status tracking columns
    await queryRunner.query(`
      ALTER TABLE wizard_sessions
        ADD COLUMN deployment_status VARCHAR(50) DEFAULT 'draft',
        ADD COLUMN last_deployed_at TIMESTAMP,
        ADD COLUMN site_url VARCHAR(255),
        ADD COLUMN error_message TEXT
    `);

    // Add index for quick status filtering
    await queryRunner.query(`
      CREATE INDEX idx_wizard_sessions_deployment_status
        ON wizard_sessions(deployment_status)
    `);

    // Update existing deployed sites to 'deployed' status
    await queryRunner.query(`
      UPDATE wizard_sessions
      SET deployment_status = 'deployed',
          last_deployed_at = created_at
      WHERE current_step = 6
        AND site_name IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_wizard_sessions_deployment_status
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE wizard_sessions
        DROP COLUMN IF EXISTS deployment_status,
        DROP COLUMN IF EXISTS last_deployed_at,
        DROP COLUMN IF EXISTS site_url,
        DROP COLUMN IF EXISTS error_message
    `);
  }
}
