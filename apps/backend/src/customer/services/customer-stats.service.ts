import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Session } from '../../auth/entities/session.entity';
import {
  CustomerActivity,
  ActivityType,
} from '../entities/customer-activity.entity';
import {
  CustomerDashboardStatsDto,
  CustomerUsageMetricsDto,
} from '../dto/customer-dashboard.dto';

@Injectable()
export class CustomerStatsService {
  private readonly logger = new Logger(CustomerStatsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(CustomerActivity)
    private activityRepository: Repository<CustomerActivity>,
  ) {}

  async getDashboardStats(userId: string): Promise<CustomerDashboardStatsDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['sessions'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate account age
      const accountAge = this.calculateAccountAge(user.createdAt);

      // Get last activity
      const lastActivity = await this.getLastActivity(userId);

      // Get usage statistics
      const usage = await this.getUsageStatistics(userId);

      // Get recent activity summary
      const recentActivity = await this.getRecentActivitySummary(userId);

      // For now, we'll use placeholder values for site counts
      // These would be replaced with actual site data when site entities are available
      const totalSites = 0; // Placeholder
      const activeSites = 0; // Placeholder

      return {
        totalSites,
        activeSites,
        accountAge,
        lastActivity,
        usage,
        recentActivity,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard stats for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUsageMetrics(userId: string): Promise<CustomerUsageMetricsDto> {
    try {
      // Get daily metrics for the past 30 days
      const dailyMetrics = await this.getDailyUsageMetrics(userId, 30);

      // Calculate weekly summary
      const weeklySummary = await this.getWeeklySummary(userId);

      // Calculate monthly trends
      const monthlyTrends = await this.getMonthlyTrends(userId);

      return {
        dailyMetrics,
        weeklySummary,
        monthlyTrends,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get usage metrics for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  private calculateAccountAge(createdAt: Date): {
    days: number;
    months: number;
    years: number;
  } {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    return { days, months, years };
  }

  private async getLastActivity(userId: string): Promise<{
    date: Date;
    daysAgo: number;
  }> {
    const lastActivity = await this.activityRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!lastActivity) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const date = user?.createdAt || new Date();
      const daysAgo = Math.ceil(
        (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { date, daysAgo };
    }

    const daysAgo = Math.ceil(
      (Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      date: lastActivity.createdAt,
      daysAgo,
    };
  }

  private async getUsageStatistics(userId: string): Promise<{
    totalLogins: number;
    totalSessions: number;
    averageSessionDuration: number;
  }> {
    const [totalLogins, sessions] = await Promise.all([
      this.activityRepository.count({
        where: { userId, type: ActivityType.LOGIN },
      }),
      this.sessionRepository.find({
        where: { userId, isActive: false }, // Only completed sessions
      }),
    ]);

    const totalSessions = sessions.length;

    // Calculate average session duration
    let totalDuration = 0;
    sessions.forEach((session) => {
      if (session.expiresAt && session.createdAt) {
        totalDuration +=
          session.expiresAt.getTime() - session.createdAt.getTime();
      }
    });

    const averageSessionDuration =
      totalSessions > 0
        ? Math.round(totalDuration / totalSessions / (1000 * 60)) // Convert to minutes
        : 0;

    return {
      totalLogins,
      totalSessions,
      averageSessionDuration,
    };
  }

  private async getRecentActivitySummary(userId: string): Promise<{
    sitesCreated: number;
    sitesModified: number;
    loginsThisWeek: number;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentActivities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt >= :weekAgo', { weekAgo })
      .getMany();

    const sitesCreated = recentActivities.filter(
      (a) => a.type === ActivityType.SITE_CREATED,
    ).length;
    const sitesModified = recentActivities.filter(
      (a) => a.type === ActivityType.SITE_UPDATED,
    ).length;
    const loginsThisWeek = recentActivities.filter(
      (a) => a.type === ActivityType.LOGIN,
    ).length;

    return { sitesCreated, sitesModified, loginsThisWeek };
  }

  private async getDailyUsageMetrics(
    userId: string,
    days: number,
  ): Promise<
    Array<{
      date: string;
      logins: number;
      sessionDuration: number;
      activities: number;
    }>
  > {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt >= :startDate', { startDate })
      .andWhere('activity.createdAt <= :endDate', { endDate })
      .getMany();

    // Group by date
    const dailyData = new Map<
      string,
      {
        logins: number;
        activities: number;
        sessionDuration: number;
      }
    >();

    // Initialize all dates
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

    // Aggregate data
    activities.forEach((activity) => {
      const dateStr = activity.createdAt.toISOString().split('T')[0];
      const data = dailyData.get(dateStr);

      if (data) {
        data.activities++;
        if (activity.type === ActivityType.LOGIN) {
          data.logins++;
        }
      }
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      logins: data.logins,
      sessionDuration: data.sessionDuration,
      activities: data.activities,
    }));
  }

  private async getWeeklySummary(userId: string): Promise<{
    totalLogins: number;
    averageSessionTime: number;
    mostActiveDay: string;
    totalActivities: number;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [weeklyActivities, weeklySessions] = await Promise.all([
      this.activityRepository
        .createQueryBuilder('activity')
        .where('activity.userId = :userId', { userId })
        .andWhere('activity.createdAt >= :weekAgo', { weekAgo })
        .getMany(),
      this.sessionRepository
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId })
        .andWhere('session.createdAt >= :weekAgo', { weekAgo })
        .getMany(),
    ]);

    const totalLogins = weeklyActivities.filter(
      (a) => a.type === ActivityType.LOGIN,
    ).length;
    const totalActivities = weeklyActivities.length;

    // Calculate average session time
    let totalSessionTime = 0;
    weeklySessions.forEach((session) => {
      if (session.expiresAt && session.createdAt) {
        totalSessionTime +=
          session.expiresAt.getTime() - session.createdAt.getTime();
      }
    });
    const averageSessionTime =
      weeklySessions.length > 0
        ? Math.round(totalSessionTime / weeklySessions.length / (1000 * 60))
        : 0;

    // Find most active day
    const dayActivity = new Map<string, number>();
    weeklyActivities.forEach((activity) => {
      const day = activity.createdAt.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    });

    const mostActiveDay =
      Array.from(dayActivity.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'No activity';

    return {
      totalLogins,
      averageSessionTime,
      mostActiveDay,
      totalActivities,
    };
  }

  private async getMonthlyTrends(userId: string): Promise<{
    currentMonth: { logins: number; activities: number; sitesCreated: number };
    previousMonth: { logins: number; activities: number; sitesCreated: number };
    percentageChange: {
      logins: number;
      activities: number;
      sitesCreated: number;
    };
  }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(currentMonthStart.getTime() - 1);

    const [currentMonthActivities, previousMonthActivities] = await Promise.all(
      [
        this.activityRepository
          .createQueryBuilder('activity')
          .where('activity.userId = :userId', { userId })
          .andWhere('activity.createdAt >= :currentMonthStart', {
            currentMonthStart,
          })
          .getMany(),
        this.activityRepository
          .createQueryBuilder('activity')
          .where('activity.userId = :userId', { userId })
          .andWhere('activity.createdAt >= :previousMonthStart', {
            previousMonthStart,
          })
          .andWhere('activity.createdAt <= :previousMonthEnd', {
            previousMonthEnd,
          })
          .getMany(),
      ],
    );

    const currentMonth = {
      logins: currentMonthActivities.filter(
        (a) => a.type === ActivityType.LOGIN,
      ).length,
      activities: currentMonthActivities.length,
      sitesCreated: currentMonthActivities.filter(
        (a) => a.type === ActivityType.SITE_CREATED,
      ).length,
    };

    const previousMonth = {
      logins: previousMonthActivities.filter(
        (a) => a.type === ActivityType.LOGIN,
      ).length,
      activities: previousMonthActivities.length,
      sitesCreated: previousMonthActivities.filter(
        (a) => a.type === ActivityType.SITE_CREATED,
      ).length,
    };

    const calculatePercentageChange = (
      current: number,
      previous: number,
    ): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const percentageChange = {
      logins: calculatePercentageChange(
        currentMonth.logins,
        previousMonth.logins,
      ),
      activities: calculatePercentageChange(
        currentMonth.activities,
        previousMonth.activities,
      ),
      sitesCreated: calculatePercentageChange(
        currentMonth.sitesCreated,
        previousMonth.sitesCreated,
      ),
    };

    return {
      currentMonth,
      previousMonth,
      percentageChange,
    };
  }
}
