import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Simple V1 to V2 Migration - Manual data transfer
 * Inserts the specific V1 data we found into V2 PostgreSQL tables
 */
export class SimpleV1ToV2Migration1755575100000 implements MigrationInterface {
  name = 'SimpleV1ToV2Migration1755575100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Starting simple V1 → V2 data migration...');

    // Insert the 1 AI request we found in V1
    await queryRunner.query(
      `
            INSERT INTO ai_requests (
                id, site_id, customer_id, request_type, business_type, status, admin_id,
                request_data, generated_content, processing_notes,
                created_at, assigned_at, started_at, completed_at,
                estimated_cost, actual_cost
            ) VALUES (
                1, 
                'test-site-001', 
                1, 
                'services', 
                'translation',
                'completed', 
                1,
                $1,
                $2,
                'Generated services for translation business using Claude AI',
                '2025-08-07 09:43:14',
                '2025-08-07 09:46:08',
                '2025-08-07 09:49:35', 
                '2025-08-07 09:49:36',
                2.0,
                2.5
            )
        `,
      [
        JSON.stringify({
          siteName: 'Test Translation Service',
          businessType: 'translation',
          domain: 'test.example.com',
        }),
        JSON.stringify({
          services: [
            {
              name: 'Traduction professionnelle',
              description: 'Services de traduction de haute qualité',
            },
            {
              name: 'Révision et relecture',
              description: 'Correction et amélioration de vos textes',
            },
            {
              name: 'Localisation',
              description: 'Adaptation culturelle de vos contenus',
            },
          ],
          hero_text:
            'Votre partenaire de confiance pour tous vos besoins de traduction',
          cta_text: 'Demandez votre devis gratuit',
        }),
      ],
    );

    // Insert admin activity logs (6 records)
    const activityLogs = [
      [
        1,
        1,
        'start',
        'system',
        1,
        '{}',
        '127.0.0.1',
        'test-agent',
        '2025-08-07 08:55:36',
      ],
      [
        2,
        1,
        'complete',
        'system',
        1,
        '{}',
        '127.0.0.1',
        'migrated',
        '2025-08-07 08:55:36',
      ],
      [
        3,
        1,
        'start',
        'system',
        1,
        '{}',
        '::1',
        'curl/8.8.0',
        '2025-08-07 09:37:14',
      ],
      [
        4,
        1,
        'assign',
        'ai_request',
        1,
        '{"status":"assigned"}',
        '::1',
        'curl/8.8.0',
        '2025-08-07 09:46:08',
      ],
      [
        5,
        1,
        'start',
        'ai_request',
        1,
        '{"status":"processing"}',
        '::1',
        'curl/8.8.0',
        '2025-08-07 09:49:35',
      ],
      [
        6,
        1,
        'complete',
        'ai_request',
        1,
        '{"status":"completed"}',
        '::1',
        'curl/8.8.0',
        '2025-08-07 09:49:36',
      ],
    ];

    for (const log of activityLogs) {
      await queryRunner.query(
        `
                INSERT INTO admin_activity_log (
                    id, admin_id, action, target_type, target_id, details,
                    ip_address, user_agent, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
        log,
      );
    }

    // Insert AI request history (3 records showing status progression)
    await queryRunner.query(`
            INSERT INTO ai_request_history (
                id, request_id, previous_status, new_status, changed_by, change_reason, timestamp
            ) VALUES 
            (1, 1, 'pending', 'assigned', 1, 'Auto-assigned to admin', '2025-08-07 09:46:08'),
            (2, 1, 'assigned', 'processing', 1, 'Started processing request', '2025-08-07 09:49:35'),
            (3, 1, 'processing', 'completed', 1, 'Generated services successfully', '2025-08-07 09:49:36')
        `);

    console.log('✅ Simple V1 → V2 migration completed successfully');
    console.log('   - 1 AI request migrated');
    console.log('   - 6 admin activity logs migrated');
    console.log('   - 3 request history records created');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back simple V1 → V2 migration...');

    // Clean up in reverse order
    await queryRunner.query(
      'DELETE FROM ai_request_history WHERE request_id = 1',
    );
    await queryRunner.query('DELETE FROM admin_activity_log WHERE id <= 6');
    await queryRunner.query('DELETE FROM ai_requests WHERE id = 1');

    console.log('✅ Migration rollback completed');
  }
}
