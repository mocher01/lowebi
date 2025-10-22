import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateBlogPostsTable1760639625000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create blog_posts table
    await queryRunner.createTable(
      new Table({
        name: 'blog_posts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'wizard_session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'excerpt',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'draft'",
          },
          {
            name: 'published_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on wizard_session_id
    await queryRunner.createIndex(
      'blog_posts',
      new TableIndex({
        name: 'idx_blog_posts_session',
        columnNames: ['wizard_session_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'blog_posts',
      new TableIndex({
        name: 'idx_blog_posts_status',
        columnNames: ['status'],
      }),
    );

    // Create unique index on wizard_session_id + slug
    await queryRunner.createIndex(
      'blog_posts',
      new TableIndex({
        name: 'idx_blog_posts_session_slug',
        columnNames: ['wizard_session_id', 'slug'],
        isUnique: true,
      }),
    );

    // Create foreign key to wizard_sessions
    await queryRunner.createForeignKey(
      'blog_posts',
      new TableForeignKey({
        name: 'fk_blog_posts_wizard_session',
        columnNames: ['wizard_session_id'],
        referencedTableName: 'wizard_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'blog_posts',
      'fk_blog_posts_wizard_session',
    );

    // Drop indexes
    await queryRunner.dropIndex('blog_posts', 'idx_blog_posts_session_slug');
    await queryRunner.dropIndex('blog_posts', 'idx_blog_posts_status');
    await queryRunner.dropIndex('blog_posts', 'idx_blog_posts_session');

    // Drop table
    await queryRunner.dropTable('blog_posts');
  }
}
