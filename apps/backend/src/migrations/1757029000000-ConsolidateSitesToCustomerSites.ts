import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateSitesToCustomerSites1757029000000
  implements MigrationInterface
{
  name = 'ConsolidateSitesToCustomerSites1757029000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add missing columns to customer_sites table to match sites structure
    await queryRunner.query(`
      ALTER TABLE "customer_sites" 
      ADD COLUMN IF NOT EXISTS "business_type" VARCHAR,
      ADD COLUMN IF NOT EXISTS "current_wizard_session_id" UUID,
      ADD COLUMN IF NOT EXISTS "site_config" JSONB
    `);

    // Step 2: Rename subdomain to domain to match sites table
    await queryRunner.query(`
      ALTER TABLE "customer_sites" RENAME COLUMN "subdomain" TO "domain"
    `);

    // Step 3: Add foreign key constraint for wizard session
    await queryRunner.query(`
      ALTER TABLE "customer_sites" 
      ADD CONSTRAINT "fk_customer_sites_wizard_session" 
      FOREIGN KEY ("current_wizard_session_id") 
      REFERENCES "wizard_sessions"("id") 
      ON DELETE SET NULL
    `);

    // Step 4: Migrate existing data from sites to customer_sites
    await queryRunner.query(`
      INSERT INTO "customer_sites" (
        "id",
        "customer_id",
        "name",
        "domain",
        "business_type",
        "status",
        "current_wizard_session_id",
        "site_config",
        "deployment_url",
        "last_deployed_at",
        "created_at",
        "updated_at"
      )
      SELECT 
        "id",
        "customer_id",
        "site_name" as "name",
        "domain",
        "business_type",
        "status",
        "current_wizard_session_id",
        "site_config",
        "deployment_url",
        "deployed_at" as "last_deployed_at",
        "created_at",
        "updated_at"
      FROM "sites"
      WHERE "id" NOT IN (SELECT "id" FROM "customer_sites" WHERE "id" IS NOT NULL)
    `);

    // Step 5: Update wizard_sessions to point to customer_sites
    await queryRunner.query(`
      UPDATE "wizard_sessions" 
      SET "site_id" = (
        SELECT cs."id" 
        FROM "customer_sites" cs 
        WHERE cs."current_wizard_session_id" = "wizard_sessions"."id"
      )
      WHERE "site_id" IS NULL AND "current_wizard_session_id" IS NOT NULL
    `);

    console.log('✅ Sites data migrated to customer_sites table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the migration if needed

    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "customer_sites" 
      DROP CONSTRAINT IF EXISTS "fk_customer_sites_wizard_session"
    `);

    // Remove added columns
    await queryRunner.query(`
      ALTER TABLE "customer_sites" 
      DROP COLUMN IF EXISTS "business_type",
      DROP COLUMN IF EXISTS "current_wizard_session_id", 
      DROP COLUMN IF EXISTS "site_config"
    `);

    // Rename domain back to subdomain
    await queryRunner.query(`
      ALTER TABLE "customer_sites" RENAME COLUMN "domain" TO "subdomain"
    `);

    // Clear migrated data (be careful with this in production!)
    await queryRunner.query(`
      DELETE FROM "customer_sites" 
      WHERE "id" IN (SELECT "id" FROM "sites")
    `);

    console.log(
      '⚠️ Migration rolled back - customer_sites reverted to original state',
    );
  }
}
