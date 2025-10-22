import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add Step 7 Site Generation Fields
 *
 * Adds necessary fields to customer_sites table for Step 7 generation workflow:
 * - site_id: Unique identifier generated from business name (e.g., "qalyarab-institute")
 * - deployment_port: Docker container port assignment (3001, 3002, etc.)
 * - deployed_at: Timestamp when site was successfully deployed
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
export class AddStep7GenerationFields1757050000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add site_id column (unique identifier for generated sites)
    await queryRunner.addColumn(
      'customer_sites',
      new TableColumn({
        name: 'site_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
        comment:
          'Unique site identifier generated from business name (e.g., qalyarab-institute)',
      }),
    );

    // Add deployment_port column (Docker container port)
    await queryRunner.addColumn(
      'customer_sites',
      new TableColumn({
        name: 'deployment_port',
        type: 'integer',
        isNullable: true,
        comment:
          'Port number where Docker container is running (3001, 3002, etc.)',
      }),
    );

    // Add deployed_at column (successful deployment timestamp)
    await queryRunner.addColumn(
      'customer_sites',
      new TableColumn({
        name: 'deployed_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'Timestamp when site was successfully deployed',
      }),
    );

    // Create index on site_id for fast lookups
    await queryRunner.query(`
      CREATE INDEX idx_customer_sites_site_id ON customer_sites(site_id);
    `);

    // Create index on deployment_port for port assignment queries
    await queryRunner.query(`
      CREATE INDEX idx_customer_sites_deployment_port ON customer_sites(deployment_port);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_customer_sites_deployment_port;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_customer_sites_site_id;`);

    // Drop columns in reverse order
    await queryRunner.dropColumn('customer_sites', 'deployed_at');
    await queryRunner.dropColumn('customer_sites', 'deployment_port');
    await queryRunner.dropColumn('customer_sites', 'site_id');
  }
}
