import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '../entities/customer-activity.entity';

export class CustomerDashboardStatsDto {
  @ApiProperty({ description: 'Total number of sites created by customer' })
  totalSites: number;

  @ApiProperty({ description: 'Number of active sites' })
  activeSites: number;

  @ApiProperty({ description: 'Account creation date' })
  accountAge: {
    days: number;
    months: number;
    years: number;
  };

  @ApiProperty({ description: 'Last login information' })
  lastActivity: {
    date: Date;
    daysAgo: number;
  };

  @ApiProperty({ description: 'Usage statistics' })
  usage: {
    totalLogins: number;
    totalSessions: number;
    averageSessionDuration: number; // in minutes
  };

  @ApiPropertyOptional({ description: 'Recent activity summary' })
  recentActivity?: {
    sitesCreated: number;
    sitesModified: number;
    loginsThisWeek: number;
  };
}

export class CustomerActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: ActivityType;

  @ApiProperty()
  description: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;
}

export class CustomerActivityListDto {
  @ApiProperty({ type: [CustomerActivityDto] })
  activities: CustomerActivityDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CustomerUsageMetricsDto {
  @ApiProperty({ description: 'Daily usage metrics for the past 30 days' })
  dailyMetrics: Array<{
    date: string;
    logins: number;
    sessionDuration: number;
    activities: number;
  }>;

  @ApiProperty({ description: 'Weekly summary' })
  weeklySummary: {
    totalLogins: number;
    averageSessionTime: number;
    mostActiveDay: string;
    totalActivities: number;
  };

  @ApiProperty({ description: 'Monthly trends' })
  monthlyTrends: {
    currentMonth: {
      logins: number;
      activities: number;
      sitesCreated: number;
    };
    previousMonth: {
      logins: number;
      activities: number;
      sitesCreated: number;
    };
    percentageChange: {
      logins: number;
      activities: number;
      sitesCreated: number;
    };
  };
}
