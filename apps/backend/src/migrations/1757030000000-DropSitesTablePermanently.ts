import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSitesTablePermanently1757030000000
  implements MigrationInterface
{
  name = 'DropSitesTablePermanently1757030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop all foreign key constraints that reference sites table
    await queryRunner.query(`
      ALTER TABLE ai_requests DROP CONSTRAINT IF EXISTS ai_requests_site_id_fkey;
    `);

    await queryRunner.query(`
      ALTER TABLE wizard_sessions DROP CONSTRAINT IF EXISTS wizard_sessions_site_id_fkey;
    `);

    await queryRunner.query(`
      ALTER TABLE site_analytics DROP CONSTRAINT IF EXISTS site_analytics_site_id_fkey;
    `);

    // Drop the sites table permanently
    await queryRunner.query(`
      DROP TABLE IF EXISTS sites CASCADE;
    `);

    // Add new foreign key constraints to reference customer_sites instead
    await queryRunner.query(`
      ALTER TABLE ai_requests ADD CONSTRAINT ai_requests_site_id_fkey 
      FOREIGN KEY (site_id) REFERENCES customer_sites(id) ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE wizard_sessions ADD CONSTRAINT wizard_sessions_site_id_fkey 
      FOREIGN KEY (site_id) REFERENCES customer_sites(id) ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE site_analytics ADD CONSTRAINT site_analytics_site_id_fkey 
      FOREIGN KEY (site_id) REFERENCES customer_sites(id) ON DELETE CASCADE;
    `);

    console.log(
      '✅ Sites table permanently dropped - all references now point to customer_sites',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be reversed as the sites table is permanently removed
    // If you need to restore, you'll need to recreate from backup
    throw new Error(
      'Cannot reverse permanent sites table removal - restore from backup if needed',
    );
  }
}
