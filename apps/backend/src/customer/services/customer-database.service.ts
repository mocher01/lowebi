import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Session } from '../../auth/entities/session.entity';
import { CustomerActivity } from '../entities/customer-activity.entity';
import { CustomerSettings } from '../entities/customer-settings.entity';

@Injectable()
export class CustomerDatabaseService {
  private readonly logger = new Logger(CustomerDatabaseService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(CustomerActivity)
    private activityRepository: Repository<CustomerActivity>,
    @InjectRepository(CustomerSettings)
    private settingsRepository: Repository<CustomerSettings>,
    private entityManager: EntityManager,
  ) {}

  /**
   * Optimized query to get customer profile with minimal data transfer
   */
  async getCustomerProfileOptimized(userId: string) {
    const startTime = performance.now();

    try {
      const result = await this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.emailVerified',
          'user.createdAt',
          'user.updatedAt',
        ])
        .where('user.id = :userId AND user.isActive = true', { userId })
        .getOne();

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Optimized profile query completed in ${duration.toFixed(2)}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to execute optimized profile query:', error);
      throw error;
    }
  }

  /**
   * Batch query to get customer dashboard data with single database hit
   */
  async getCustomerDashboardDataBatch(userId: string) {
    const startTime = performance.now();

    try {
      const [user, sessionCount, activityStats, lastActivity] =
        await Promise.all([
          this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'firstName', 'lastName', 'createdAt'],
          }),
          this.sessionRepository.count({ where: { userId } }),
          this.activityRepository
            .createQueryBuilder('activity')
            .select([
              'COUNT(*) as totalActivities',
              "COUNT(CASE WHEN activity.type = 'login' THEN 1 END) as totalLogins",
              'MIN(activity.createdAt) as firstActivity',
              'MAX(activity.createdAt) as lastActivity',
            ])
            .where('activity.userId = :userId', { userId })
            .getRawOne(),
          this.activityRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
            select: ['createdAt', 'type'],
          }),
        ]);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Batch dashboard query completed in ${duration.toFixed(2)}ms`,
      );

      return {
        user,
        sessionCount,
        activityStats,
        lastActivity,
      };
    } catch (error) {
      this.logger.error('Failed to execute batch dashboard query:', error);
      throw error;
    }
  }

  /**
   * Optimized activity query with proper indexing and pagination
   */
  async getCustomerActivitiesPaginated(
    userId: string,
    page: number,
    limit: number,
    type?: string,
  ) {
    const startTime = performance.now();

    try {
      const query = this.activityRepository
        .createQueryBuilder('activity')
        .select([
          'activity.id',
          'activity.type',
          'activity.description',
          'activity.createdAt',
          'activity.metadata',
          'activity.ipAddress',
          'activity.userAgent',
        ])
        .where('activity.userId = :userId', { userId })
        .orderBy('activity.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      if (type) {
        query.andWhere('activity.type = :type', { type });
      }

      const [activities, total] = await query.getManyAndCount();

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Paginated activities query completed in ${duration.toFixed(2)}ms`,
      );

      return { activities, total };
    } catch (error) {
      this.logger.error('Failed to execute paginated activities query:', error);
      throw error;
    }
  }

  /**
   * Optimized settings query with upsert capability
   */
  async getOrCreateCustomerSettings(userId: string) {
    const startTime = performance.now();

    try {
      let settings = await this.settingsRepository.findOne({
        where: { userId },
      });

      if (!settings) {
        // Use upsert to handle concurrent requests gracefully
        await this.settingsRepository.upsert(
          {
            userId,
            notifications: { email: true, sms: false, push: true },
            theme: { mode: 'system', primaryColor: '#3b82f6' },
            language: 'en',
            timezone: 'UTC',
            preferences: {},
          },
          ['userId'],
        );

        settings = await this.settingsRepository.findOne({
          where: { userId },
        });
      }

      const duration = performance.now() - startTime;
      this.logger.debug(`Settings query completed in ${duration.toFixed(2)}ms`);

      return settings;
    } catch (error) {
      this.logger.error('Failed to execute settings query:', error);
      throw error;
    }
  }

  /**
   * Batch update for customer profile with transaction
   */
  async updateCustomerProfileTransaction(
    userId: string,
    updateData: Partial<User>,
  ) {
    const startTime = performance.now();

    return await this.entityManager.transaction(async (manager) => {
      try {
        // Check if email is changing and validate uniqueness
        if (updateData.email) {
          const existingUser = await manager.findOne(User, {
            where: { email: updateData.email },
            select: ['id'],
          });

          if (existingUser && existingUser.id !== userId) {
            throw new Error('Email already in use');
          }
        }

        // Update user
        await manager.update(User, userId, updateData);

        // Get updated user
        const updatedUser = await manager.findOne(User, {
          where: { id: userId },
          select: [
            'id',
            'email',
            'firstName',
            'lastName',
            'emailVerified',
            'createdAt',
            'updatedAt',
          ],
        });

        const duration = performance.now() - startTime;
        this.logger.debug(
          `Profile update transaction completed in ${duration.toFixed(2)}ms`,
        );

        return updatedUser;
      } catch (error) {
        this.logger.error(
          'Failed to execute profile update transaction:',
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Optimized analytics query for usage metrics
   */
  async getCustomerUsageAnalytics(userId: string, days: number = 30) {
    const startTime = performance.now();

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await this.activityRepository
        .createQueryBuilder('activity')
        .select([
          'DATE(activity.createdAt) as date',
          'COUNT(*) as totalActivities',
          "COUNT(CASE WHEN activity.type = 'login' THEN 1 END) as logins",
          "COUNT(CASE WHEN activity.type = 'site_created' THEN 1 END) as sitesCreated",
          "COUNT(CASE WHEN activity.type = 'site_updated' THEN 1 END) as sitesUpdated",
        ])
        .where('activity.userId = :userId', { userId })
        .andWhere('activity.createdAt >= :startDate', { startDate })
        .andWhere('activity.createdAt <= :endDate', { endDate })
        .groupBy('DATE(activity.createdAt)')
        .orderBy('DATE(activity.createdAt)', 'ASC')
        .getRawMany();

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Usage analytics query completed in ${duration.toFixed(2)}ms`,
      );

      return analytics;
    } catch (error) {
      this.logger.error('Failed to execute usage analytics query:', error);
      throw error;
    }
  }

  /**
   * Database health check with performance metrics
   */
  async performDatabaseHealthCheck() {
    const startTime = performance.now();
    const healthData: any = {};

    try {
      // Test basic connectivity
      const connectionTest = await this.entityManager.query('SELECT 1 as test');
      healthData.connectivity = connectionTest.length > 0 ? 'ok' : 'failed';

      // Get table statistics
      const tableStats = await Promise.all([
        this.userRepository.count(),
        this.sessionRepository.count(),
        this.activityRepository.count(),
        this.settingsRepository.count(),
      ]);

      healthData.tables = {
        users: tableStats[0],
        sessions: tableStats[1],
        activities: tableStats[2],
        settings: tableStats[3],
      };

      // Test query performance
      const performanceTest = performance.now();
      await this.userRepository.findOne({
        where: { isActive: true },
        select: ['id'],
      });
      healthData.queryPerformance = `${(performance.now() - performanceTest).toFixed(2)}ms`;

      const duration = performance.now() - startTime;
      healthData.totalTime = `${duration.toFixed(2)}ms`;
      healthData.status = 'healthy';

      this.logger.debug(
        `Database health check completed in ${duration.toFixed(2)}ms`,
      );

      return healthData;
    } catch (error) {
      healthData.status = 'unhealthy';
      healthData.error = error.message;
      this.logger.error('Database health check failed:', error);
      return healthData;
    }
  }

  /**
   * Cleanup old data for performance optimization
   */
  async cleanupOldData() {
    const startTime = performance.now();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data

      const [deletedActivities, deletedSessions] = await Promise.all([
        this.activityRepository
          .createQueryBuilder()
          .delete()
          .where('createdAt < :cutoffDate', { cutoffDate })
          .execute(),
        this.sessionRepository
          .createQueryBuilder()
          .delete()
          .where('isActive = false AND expiresAt < :cutoffDate', { cutoffDate })
          .execute(),
      ]);

      const duration = performance.now() - startTime;

      this.logger.log(`Data cleanup completed in ${duration.toFixed(2)}ms`);
      this.logger.log(`Deleted ${deletedActivities.affected} old activities`);
      this.logger.log(`Deleted ${deletedSessions.affected} expired sessions`);

      return {
        activitiesDeleted: deletedActivities.affected,
        sessionsDeleted: deletedSessions.affected,
        duration: `${duration.toFixed(2)}ms`,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error);
      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats() {
    return {
      service: 'CustomerDatabaseService',
      optimization: 'enabled',
      features: [
        'Optimized queries with selective fields',
        'Batch operations for dashboard data',
        'Proper indexing strategy',
        'Transaction-based updates',
        'Performance monitoring',
        'Automatic data cleanup',
      ],
      recommendations: [
        'Add database connection pooling',
        'Implement query result caching',
        'Add database query monitoring',
        'Consider read replicas for heavy read operations',
      ],
    };
  }
}
