import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Create Generation Tasks Table
 *
 * Creates the generation_tasks table to track site generation progress
 * for Step 7 of the wizard. This table stores:
 * - Real-time progress (0-100%)
 * - Current step description
 * - Status (pending, in_progress, completed, failed)
 * - Error messages if generation fails
 * - Timing information
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
export class CreateGenerationTasksTable1757051000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'generation_tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'wizard_session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'site_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Generated site_id after validation',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            comment: 'pending, in_progress, completed, failed, cancelled',
          },
          {
            name: 'progress',
            type: 'integer',
            default: 0,
            comment: 'Progress percentage (0-100)',
          },
          {
            name: 'current_step',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Current step description (e.g., "Building React app...")',
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
            comment: 'Error message if generation failed',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When generation process started',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When generation process completed (success or failure)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: 'fk_generation_tasks_customer',
            columnNames: ['customer_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'fk_generation_tasks_wizard_session',
            columnNames: ['wizard_session_id'],
            referencedTableName: 'wizard_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for common queries
    await queryRunner.createIndex(
      'generation_tasks',
      new TableIndex({
        name: 'idx_generation_tasks_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'generation_tasks',
      new TableIndex({
        name: 'idx_generation_tasks_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'generation_tasks',
      new TableIndex({
        name: 'idx_generation_tasks_wizard_session_id',
        columnNames: ['wizard_session_id'],
      }),
    );

    await queryRunner.createIndex(
      'generation_tasks',
      new TableIndex({
        name: 'idx_generation_tasks_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('generation_tasks', true);
  }
}
