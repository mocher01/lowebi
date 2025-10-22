import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  CustomerActivity,
  ActivityType,
} from '../entities/customer-activity.entity';
import {
  CustomerActivityDto,
  CustomerActivityListDto,
} from '../dto/customer-dashboard.dto';

@Injectable()
export class CustomerActivityService {
  private readonly logger = new Logger(CustomerActivityService.name);

  constructor(
    @InjectRepository(CustomerActivity)
    private activityRepository: Repository<CustomerActivity>,
  ) {}

  async logActivity(
    userId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CustomerActivity> {
    try {
      const activity = this.activityRepository.create({
        userId,
        type,
        description,
        metadata,
        ipAddress,
        userAgent,
      });

      return await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.error(`Failed to log activity for user ${userId}:`, error);
      throw error;
    }
  }

  async getCustomerActivities(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: ActivityType,
  ): Promise<CustomerActivityListDto> {
    try {
      const offset = (page - 1) * limit;

      const queryBuilder = this.activityRepository
        .createQueryBuilder('activity')
        .where('activity.userId = :userId', { userId })
        .orderBy('activity.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      if (type) {
        queryBuilder.andWhere('activity.type = :type', { type });
      }

      const [activities, total] = await queryBuilder.getManyAndCount();

      const activityDtos: CustomerActivityDto[] = activities.map(
        (activity) => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          timestamp: activity.createdAt,
          metadata: activity.metadata,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
        }),
      );

      return {
        activities: activityDtos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get activities for user ${userId}:`, error);
      throw error;
    }
  }

  async getRecentActivity(
    userId: string,
    days: number = 7,
  ): Promise<{
    sitesCreated: number;
    sitesModified: number;
    loginsThisWeek: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.activityRepository.find({
        where: {
          userId,
          createdAt: Between(startDate, new Date()),
        },
      });

      const sitesCreated = activities.filter(
        (a) => a.type === ActivityType.SITE_CREATED,
      ).length;
      const sitesModified = activities.filter(
        (a) => a.type === ActivityType.SITE_UPDATED,
      ).length;
      const loginsThisWeek = activities.filter(
        (a) => a.type === ActivityType.LOGIN,
      ).length;

      return { sitesCreated, sitesModified, loginsThisWeek };
    } catch (error) {
      this.logger.error(
        `Failed to get recent activity for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getDailyMetrics(
    userId: string,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      logins: number;
      sessionDuration: number;
      activities: number;
    }>
  > {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.activityRepository
        .createQueryBuilder('activity')
        .where('activity.userId = :userId', { userId })
        .andWhere('activity.createdAt >= :startDate', { startDate })
        .andWhere('activity.createdAt <= :endDate', { endDate })
        .orderBy('activity.createdAt', 'ASC')
        .getMany();

      // Group activities by date
      const dailyData = new Map<
        string,
        {
          logins: number;
          activities: number;
          sessionDuration: number;
        }
      >();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        dailyData.set(dateStr, {
          logins: 0,
          activities: 0,
          sessionDuration: 0,
        });
      }

      activities.forEach((activity) => {
        const dateStr = activity.createdAt.toISOString().split('T')[0];
        const data = dailyData.get(dateStr);

        if (data) {
          data.activities++;
          if (activity.type === ActivityType.LOGIN) {
            data.logins++;
            // Estimate session duration from metadata if available
            if (activity.metadata?.sessionDuration) {
              data.sessionDuration += activity.metadata.sessionDuration;
            }
          }
        }
      });

      return Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        logins: data.logins,
        sessionDuration: data.sessionDuration / (data.logins || 1), // Average session duration
        activities: data.activities,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get daily metrics for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getActivityCounts(userId: string): Promise<{
    totalLogins: number;
    totalActivities: number;
  }> {
    try {
      const [totalLogins, totalActivities] = await Promise.all([
        this.activityRepository.count({
          where: { userId, type: ActivityType.LOGIN },
        }),
        this.activityRepository.count({
          where: { userId },
        }),
      ]);

      return { totalLogins, totalActivities };
    } catch (error) {
      this.logger.error(
        `Failed to get activity counts for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async cleanupOldActivities(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.activityRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old activity records`);
    } catch (error) {
      this.logger.error('Failed to cleanup old activities:', error);
      throw error;
    }
  }
}
