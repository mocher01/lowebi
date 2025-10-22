import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPortAndUrlToGenerationTasks1757052000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deployment_port column
    await queryRunner.addColumn(
      'generation_tasks',
      new TableColumn({
        name: 'deployment_port',
        type: 'integer',
        isNullable: true,
      }),
    );

    // Add site_url column
    await queryRunner.addColumn(
      'generation_tasks',
      new TableColumn({
        name: 'site_url',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('generation_tasks', 'site_url');
    await queryRunner.dropColumn('generation_tasks', 'deployment_port');
  }
}
