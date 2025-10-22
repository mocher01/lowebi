import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAiRequestAdminId1755577000000 implements MigrationInterface {
  name = 'FixAiRequestAdminId1755577000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, drop the foreign key constraint if it exists
    await queryRunner
      .query(
        `
      ALTER TABLE "ai_requests" 
      DROP COLUMN IF EXISTS "admin_id"
    `,
      )
      .catch(() => {
        // Column might not exist, that's okay
      });

    // Add admin_id as UUID to match the users table
    await queryRunner.query(`
      ALTER TABLE "ai_requests" 
      ADD COLUMN "admin_id" uuid
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_requests_admin_id" 
      ON "ai_requests" ("admin_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ai_requests_admin_id"`);
    await queryRunner.query(`ALTER TABLE "ai_requests" DROP COLUMN "admin_id"`);

    // Restore old numeric column if needed
    await queryRunner.query(`
      ALTER TABLE "ai_requests" 
      ADD COLUMN "admin_id" integer
    `);
  }
}
