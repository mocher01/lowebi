import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagesDraftToAiRequests1704113400000
  implements MigrationInterface
{
  name = 'AddImagesDraftToAiRequests1704113400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_requests"
      ADD COLUMN "images_draft" jsonb DEFAULT '{}'::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_requests"
      ADD COLUMN "images_version" integer NOT NULL DEFAULT 0
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "ai_requests"."images_draft" IS 'Draft images uploaded during admin processing - persisted even without completion'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "ai_requests"."images_version" IS 'Version counter incremented on each image draft update - used for cache invalidation'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_requests" DROP COLUMN "images_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_requests" DROP COLUMN "images_draft"`,
    );
  }
}
