import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Session } from '../../auth/entities/session.entity';
import { CustomerSite } from '../../customer/entities/customer-site.entity';
import { SiteAnalytics } from '../entities/site-analytics.entity';
import { AuditLog } from '../entities/audit-log.entity';

export interface SystemMetricsDto {
  system: {
    uptime: number;
    uptimeFormatted: string;
    nodeVersion: string;
    platform: string;
    architecture: string;
    loadAverage?: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    connectionCount?: number;
    activeQueries?: number;
  };
  application: {
    totalUsers: number;
    activeUsers: number;
    totalSites: number;
    activeSites: number;
    totalSessions: number;
    activeSessions: number;
    adminActions24h: number;
    pageViews24h: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    slowQueries: number;
  };
  security: {
    failedLogins24h: number;
    suspiciousActivity: number;
    blockedIPs: number;
  };
}

export interface DatabaseMetricsDto {
  status: 'healthy' | 'warning' | 'critical';
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    locksWaiting: number;
    cacheHitRatio: number;
  };
  storage: {
    totalSize: string;
    dataSize: string;
    indexSize: string;
    freeSpace: string;
  };
  tables: Array<{
    name: string;
    rowCount: number;
    size: string;
    lastAnalyzed: Date;
  }>;
}

export interface ErrorTrackingDto {
  summary: {
    total24h: number;
    total7d: number;
    total30d: number;
    currentErrorRate: number;
  };
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  errorsByEndpoint: Array<{
    endpoint: string;
    errorCount: number;
    errorRate: number;
  }>;
  errorTrends: Array<{
    hour: string;
    errorCount: number;
    requestCount: number;
    errorRate: number;
  }>;
}

@Injectable()
export class SystemMonitoringService {
  private readonly logger = new Logger(SystemMonitoringService.name);
  private performanceMetrics: Map<string, any> = new Map();
  private errorLog: Array<any> = [];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(CustomerSite)
    private siteRepository: Repository<CustomerSite>,
    @InjectRepository(SiteAnalytics)
    private analyticsRepository: Repository<SiteAnalytics>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async getSystemMetrics(): Promise<SystemMetricsDto> {
    const startTime = Date.now();

    try {
      // Test database connection
      await this.userRepository.query('SELECT 1');
      const dbResponseTime = Date.now() - startTime;

      // Get system information
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Get application metrics
      const [
        totalUsers,
        activeUsers,
        totalSites,
        activeSites,
        totalSessions,
        activeSessions,
        adminActions24h,
        pageViews24h,
      ] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
        this.siteRepository.count(),
        this.siteRepository.count({ where: { isActive: true } }),
        this.sessionRepository.count(),
        this.sessionRepository.count({ where: { isActive: true } }),
        this.getAdminActions24h(),
        this.getPageViews24h(),
      ]);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics();

      return {
        system: {
          uptime: uptime,
          uptimeFormatted: this.formatUptime(uptime),
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          loadAverage:
            process.platform !== 'win32' ? require('os').loadavg() : undefined,
        },
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
        },
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
        application: {
          totalUsers,
          activeUsers,
          totalSites,
          activeSites,
          totalSessions,
          activeSessions,
          adminActions24h,
          pageViews24h,
        },
        performance: performanceMetrics,
        security: {
          failedLogins24h: 0, // TODO: Implement failed login tracking
          suspiciousActivity: 0, // TODO: Implement suspicious activity detection
          blockedIPs: 0, // TODO: Implement IP blocking
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system metrics', error);

      return {
        system: {
          uptime: process.uptime(),
          uptimeFormatted: this.formatUptime(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
        },
        memory: {
          used: 0,
          total: 0,
          free: 0,
          percentage: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        },
        database: {
          status: 'error',
          responseTime: -1,
        },
        application: {
          totalUsers: 0,
          activeUsers: 0,
          totalSites: 0,
          activeSites: 0,
          totalSessions: 0,
          activeSessions: 0,
          adminActions24h: 0,
          pageViews24h: 0,
        },
        performance: {
          avgResponseTime: 0,
          requestsPerMinute: 0,
          errorRate: 0,
          slowQueries: 0,
        },
        security: {
          failedLogins24h: 0,
          suspiciousActivity: 0,
          blockedIPs: 0,
        },
      };
    }
  }

  async getDatabaseMetrics(): Promise<DatabaseMetricsDto> {
    try {
      // Get basic database statistics
      const tableStats = await this.getTableStatistics();

      return {
        status: 'healthy',
        connections: {
          active: 10, // TODO: Get from actual connection pool
          idle: 5,
          total: 15,
          max: 20,
        },
        performance: {
          avgQueryTime: 25.5, // TODO: Calculate from actual metrics
          slowQueries: 2,
          locksWaiting: 0,
          cacheHitRatio: 98.5,
        },
        storage: {
          totalSize: '256 MB', // TODO: Get actual database size
          dataSize: '180 MB',
          indexSize: '76 MB',
          freeSpace: '15 GB',
        },
        tables: tableStats,
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics', error);

      return {
        status: 'critical',
        connections: { active: 0, idle: 0, total: 0, max: 0 },
        performance: {
          avgQueryTime: 0,
          slowQueries: 0,
          locksWaiting: 0,
          cacheHitRatio: 0,
        },
        storage: {
          totalSize: 'Unknown',
          dataSize: 'Unknown',
          indexSize: 'Unknown',
          freeSpace: 'Unknown',
        },
        tables: [],
      };
    }
  }

  async getErrorTracking(): Promise<ErrorTrackingDto> {
    try {
      // Get error statistics from logs (simplified implementation)
      const total24h = this.errorLog.filter(
        (error) => error.timestamp > Date.now() - 24 * 60 * 60 * 1000,
      ).length;

      const total7d = this.errorLog.filter(
        (error) => error.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).length;

      const total30d = this.errorLog.filter(
        (error) => error.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).length;

      return {
        summary: {
          total24h,
          total7d,
          total30d,
          currentErrorRate: 0.05, // TODO: Calculate actual error rate
        },
        topErrors: [
          {
            message: 'Database connection timeout',
            count: 5,
            lastOccurrence: new Date(),
            severity: 'medium',
          },
          {
            message: 'Invalid JWT token',
            count: 12,
            lastOccurrence: new Date(Date.now() - 2 * 60 * 60 * 1000),
            severity: 'low',
          },
        ],
        errorsByEndpoint: [
          {
            endpoint: '/api/admin/users',
            errorCount: 3,
            errorRate: 0.02,
          },
          {
            endpoint: '/api/auth/login',
            errorCount: 8,
            errorRate: 0.01,
          },
        ],
        errorTrends: this.generateErrorTrends(),
      };
    } catch (error) {
      this.logger.error('Failed to get error tracking data', error);

      return {
        summary: { total24h: 0, total7d: 0, total30d: 0, currentErrorRate: 0 },
        topErrors: [],
        errorsByEndpoint: [],
        errorTrends: [],
      };
    }
  }

  // Performance tracking methods
  trackRequest(
    endpoint: string,
    responseTime: number,
    statusCode: number,
  ): void {
    const key = `${endpoint}:${new Date().getHours()}`;
    const existing = this.performanceMetrics.get(key) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    };

    existing.count++;
    existing.totalTime += responseTime;

    if (statusCode >= 400) {
      existing.errors++;
    }

    this.performanceMetrics.set(key, existing);
  }

  trackError(endpoint: string, error: any, statusCode: number): void {
    this.errorLog.push({
      endpoint,
      error: error.message || error,
      statusCode,
      timestamp: Date.now(),
    });

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
  }

  // Private helper methods
  private async getAdminActions24h(): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
      .getCount();
  }

  private async getPageViews24h(): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.timestamp >= :twentyFourHoursAgo', {
        twentyFourHoursAgo,
      })
      .andWhere('analytics.eventType = :eventType', { eventType: 'page_view' })
      .getCount();
  }

  private async getTableStatistics(): Promise<
    Array<{ name: string; rowCount: number; size: string; lastAnalyzed: Date }>
  > {
    try {
      const tables = [
        'users',
        'sessions',
        'sites',
        'site_analytics',
        'audit_logs',
      ];
      const stats: Array<{
        name: string;
        rowCount: number;
        size: string;
        lastAnalyzed: Date;
      }> = [];

      for (const table of tables) {
        try {
          const result = await this.userRepository.query(
            `SELECT COUNT(*) as row_count FROM ${table}`,
          );

          stats.push({
            name: table,
            rowCount: parseInt(result[0].row_count),
            size: 'Unknown', // TODO: Calculate actual table size
            lastAnalyzed: new Date(),
          });
        } catch (error) {
          this.logger.warn(`Failed to get stats for table ${table}`, error);
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get table statistics', error);
      return [];
    }
  }

  private calculatePerformanceMetrics(): {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    slowQueries: number;
  } {
    const currentHour = new Date().getHours();
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;

    for (const [key, metrics] of this.performanceMetrics.entries()) {
      if (key.endsWith(`:${currentHour}`)) {
        totalRequests += metrics.count;
        totalTime += metrics.totalTime;
        totalErrors += metrics.errors;
      }
    }

    return {
      avgResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      requestsPerMinute: totalRequests, // Simplified calculation
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      slowQueries: 0, // TODO: Track slow database queries
    };
  }

  private generateErrorTrends(): Array<{
    hour: string;
    errorCount: number;
    requestCount: number;
    errorRate: number;
  }> {
    const trends: Array<{
      hour: string;
      errorCount: number;
      requestCount: number;
      errorRate: number;
    }> = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toISOString().slice(0, 13) + ':00:00.000Z';

      // Count errors for this hour
      const errorCount = this.errorLog.filter((error) => {
        const errorDate = new Date(error.timestamp);
        return (
          errorDate.getHours() === hour.getHours() &&
          errorDate.getDate() === hour.getDate()
        );
      }).length;

      trends.push({
        hour: hourStr,
        errorCount,
        requestCount: 100, // TODO: Track actual request counts
        errorRate: errorCount > 0 ? (errorCount / 100) * 100 : 0,
      });
    }

    return trends;
  }

  private formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}
