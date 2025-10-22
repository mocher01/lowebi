import {
  Controller,
  Get,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CustomerDatabaseService } from '../services/customer-database.service';
import { PerformanceInterceptor } from '../../common/interceptors/performance.interceptor';
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';

@ApiTags('Customer Monitoring')
@Controller('api/customer/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class CustomerMonitoringController {
  constructor(
    private readonly databaseService: CustomerDatabaseService,
    private readonly performanceInterceptor: PerformanceInterceptor,
    private readonly cacheInterceptor: CacheInterceptor,
  ) {}

  @Get('performance')
  @ApiOperation({
    summary: 'Get customer API performance metrics',
    description:
      'Retrieve detailed performance metrics for customer API endpoints',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getPerformanceMetrics() {
    const performanceStats = this.performanceInterceptor.getMetricsSummary();
    const cacheStats = this.cacheInterceptor.getCacheStats();
    const databaseStats = this.databaseService.getPerformanceStats();

    return {
      timestamp: new Date().toISOString(),
      performance: {
        ...performanceStats,
        targets: {
          maxResponseTime: 200, // ms
          errorRateThreshold: 0.1, // %
          uptimeTarget: 99.9, // %
        },
        status: this.getPerformanceStatus(performanceStats),
      },
      cache: {
        ...cacheStats,
        hitRateTarget: 90, // %
        status: this.getCacheStatus(cacheStats),
      },
      database: {
        ...databaseStats,
        healthCheck: await this.databaseService.performDatabaseHealthCheck(),
      },
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Customer API health check',
    description: 'Comprehensive health check for customer API components',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getHealthStatus() {
    const startTime = performance.now();

    try {
      const [databaseHealth, performanceHealth, cacheHealth] =
        await Promise.all([
          this.databaseService.performDatabaseHealthCheck(),
          this.checkPerformanceHealth(),
          this.checkCacheHealth(),
        ]);

      const duration = performance.now() - startTime;
      const overallStatus = this.determineOverallHealth([
        databaseHealth.status,
        performanceHealth.status,
        cacheHealth.status,
      ]);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration: `${duration.toFixed(2)}ms`,
        components: {
          database: databaseHealth,
          performance: performanceHealth,
          cache: cacheHealth,
        },
        targets: {
          responseTime: '< 200ms',
          errorRate: '< 0.1%',
          cacheHitRate: '> 90%',
          uptime: '> 99.9%',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
      };
    }
  }

  @Get('metrics/detailed')
  @ApiOperation({
    summary: 'Get detailed customer API metrics',
    description:
      'Retrieve comprehensive metrics including database query performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed metrics retrieved successfully',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Hours of data to retrieve (default: 24)',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async getDetailedMetrics(
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number,
  ) {
    const performanceMetrics = this.performanceInterceptor.getMetrics();
    const recentMetrics = performanceMetrics.filter(
      (metric) =>
        metric.timestamp.getTime() > Date.now() - hours * 60 * 60 * 1000,
    );

    // Group metrics by endpoint
    const endpointMetrics = new Map<
      string,
      {
        count: number;
        totalTime: number;
        minTime: number;
        maxTime: number;
        errorCount: number;
        p95Time: number;
      }
    >();

    recentMetrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointMetrics.get(key) || {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errorCount: 0,
        p95Time: 0,
      };

      existing.count++;
      existing.totalTime += metric.responseTime;
      existing.minTime = Math.min(existing.minTime, metric.responseTime);
      existing.maxTime = Math.max(existing.maxTime, metric.responseTime);

      if (metric.statusCode >= 400) {
        existing.errorCount++;
      }

      endpointMetrics.set(key, existing);
    });

    // Calculate P95 for each endpoint
    endpointMetrics.forEach((stats, endpoint) => {
      const endpointTimes = recentMetrics
        .filter((m) => `${m.method} ${m.endpoint}` === endpoint)
        .map((m) => m.responseTime)
        .sort((a, b) => a - b);

      const p95Index = Math.floor(endpointTimes.length * 0.95);
      stats.p95Time = endpointTimes[p95Index] || 0;
    });

    const detailedStats = Array.from(endpointMetrics.entries()).map(
      ([endpoint, stats]) => ({
        endpoint,
        requestCount: stats.count,
        averageResponseTime: Math.round(stats.totalTime / stats.count),
        minResponseTime: stats.minTime === Infinity ? 0 : stats.minTime,
        maxResponseTime: stats.maxTime,
        p95ResponseTime: Math.round(stats.p95Time),
        errorCount: stats.errorCount,
        errorRate: ((stats.errorCount / stats.count) * 100).toFixed(2),
        performanceGrade: this.getPerformanceGrade(
          stats.totalTime / stats.count,
          stats.errorCount / stats.count,
        ),
      }),
    );

    return {
      timestamp: new Date().toISOString(),
      timeRange: `${hours} hours`,
      totalRequests: recentMetrics.length,
      endpoints: detailedStats.sort((a, b) => b.requestCount - a.requestCount),
      summary: {
        averageResponseTime: Math.round(
          recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
            recentMetrics.length,
        ),
        totalErrors: recentMetrics.filter((m) => m.statusCode >= 400).length,
        overallErrorRate: (
          (recentMetrics.filter((m) => m.statusCode >= 400).length /
            recentMetrics.length) *
          100
        ).toFixed(2),
      },
    };
  }

  @Get('database/cleanup')
  @ApiOperation({
    summary: 'Trigger database cleanup',
    description: 'Clean up old customer data for performance optimization',
  })
  @ApiResponse({
    status: 200,
    description: 'Database cleanup completed',
  })
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // Once per 5 minutes
  async triggerDatabaseCleanup() {
    const startTime = performance.now();

    try {
      const cleanupResult = await this.databaseService.cleanupOldData();
      const duration = performance.now() - startTime;

      return {
        status: 'completed',
        timestamp: new Date().toISOString(),
        duration: `${duration.toFixed(2)}ms`,
        result: cleanupResult,
      };
    } catch (error) {
      return {
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
      };
    }
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Get cache performance statistics',
    description:
      'Retrieve detailed cache hit/miss statistics and performance data',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getCacheStats() {
    const cacheStats = this.cacheInterceptor.getCacheStats();
    const hitRate =
      cacheStats.totalEntries > 0
        ? (cacheStats.validEntries / cacheStats.totalEntries) * 100
        : 0;

    return {
      timestamp: new Date().toISOString(),
      cache: {
        ...cacheStats,
        hitRate: `${hitRate.toFixed(2)}%`,
        status: hitRate >= 90 ? 'optimal' : hitRate >= 70 ? 'good' : 'poor',
        recommendations: this.getCacheRecommendations(hitRate, cacheStats),
      },
      targets: {
        hitRate: '> 90%',
        maxMemoryUsage: '100MB',
        maxEntries: 10000,
      },
    };
  }

  private getPerformanceStatus(stats: any): string {
    if (stats.avgResponseTime > 200 || stats.errorRate > 0.1) {
      return 'critical';
    }
    if (stats.avgResponseTime > 100 || stats.errorRate > 0.05) {
      return 'warning';
    }
    return 'healthy';
  }

  private getCacheStatus(stats: any): string {
    const hitRate =
      stats.totalEntries > 0
        ? (stats.validEntries / stats.totalEntries) * 100
        : 0;

    if (hitRate >= 90) return 'optimal';
    if (hitRate >= 70) return 'good';
    return 'poor';
  }

  private async checkPerformanceHealth() {
    const stats = this.performanceInterceptor.getMetricsSummary();
    return {
      status: this.getPerformanceStatus(stats),
      averageResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`,
      errorRate: `${stats.errorRate.toFixed(2)}%`,
      totalRequests: stats.totalRequests,
    };
  }

  private async checkCacheHealth() {
    const stats = this.cacheInterceptor.getCacheStats();
    return {
      status: this.getCacheStatus(stats),
      totalEntries: stats.totalEntries,
      validEntries: stats.validEntries,
      memoryUsage: stats.memoryUsage,
    };
  }

  private determineOverallHealth(componentStatuses: string[]): string {
    if (
      componentStatuses.includes('unhealthy') ||
      componentStatuses.includes('critical')
    ) {
      return 'unhealthy';
    }
    if (componentStatuses.includes('warning')) {
      return 'degraded';
    }
    return 'healthy';
  }

  private getPerformanceGrade(avgTime: number, errorRate: number): string {
    if (avgTime <= 50 && errorRate === 0) return 'A+';
    if (avgTime <= 100 && errorRate <= 0.01) return 'A';
    if (avgTime <= 150 && errorRate <= 0.05) return 'B';
    if (avgTime <= 200 && errorRate <= 0.1) return 'C';
    return 'D';
  }

  private getCacheRecommendations(hitRate: number, stats: any): string[] {
    const recommendations: string[] = [];

    if (hitRate < 70) {
      recommendations.push('Consider increasing cache TTL for stable data');
      recommendations.push(
        'Review caching strategy for frequently accessed endpoints',
      );
    }

    if (stats.expiredEntries > stats.validEntries) {
      recommendations.push(
        'Optimize cache TTL values to reduce expired entries',
      );
    }

    if (stats.totalEntries > 5000) {
      recommendations.push('Consider implementing cache size limits');
    }

    return recommendations.length > 0
      ? recommendations
      : ['Cache performance is optimal'];
  }
}
