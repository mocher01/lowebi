import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { CacheInterceptor } from '../interceptors/cache.interceptor';

export interface OptimizationReport {
  performance: {
    avgResponseTime: number;
    slowRequests: number;
    errorRate: number;
    requestsPerMinute: number;
    topSlowEndpoints: Array<{
      endpoint: string;
      avgResponseTime: number;
      requestCount: number;
    }>;
  };
  cache: {
    hitRate: number;
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: string;
  };
  recommendations: Array<{
    type: 'performance' | 'cache' | 'database' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    solution: string;
  }>;
  optimizationScore: number; // 0-100
}

@Injectable()
export class ApiOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(ApiOptimizationService.name);
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private readonly performanceInterceptor: PerformanceInterceptor,
    private readonly cacheInterceptor: CacheInterceptor,
  ) {}

  onModuleInit() {
    // Set up periodic optimization analysis
    setInterval(() => {
      this.analyzeAndOptimize();
    }, 300000); // Every 5 minutes

    this.logger.log('API Optimization Service initialized');
  }

  async generateOptimizationReport(): Promise<OptimizationReport> {
    const performanceSummary = this.performanceInterceptor.getMetricsSummary();
    const cacheStats = this.cacheInterceptor.getCacheStats();

    const hitRate =
      this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

    const recommendations = this.generateRecommendations(
      performanceSummary,
      cacheStats,
      hitRate,
    );
    const optimizationScore = this.calculateOptimizationScore(
      performanceSummary,
      hitRate,
    );

    return {
      performance: {
        avgResponseTime: performanceSummary.avgResponseTime,
        slowRequests: performanceSummary.slowRequests,
        errorRate: performanceSummary.errorRate,
        requestsPerMinute: this.calculateRequestsPerMinute(),
        topSlowEndpoints: performanceSummary.topEndpoints
          .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
          .slice(0, 5),
      },
      cache: {
        hitRate,
        totalEntries: cacheStats.totalEntries,
        validEntries: cacheStats.validEntries,
        expiredEntries: cacheStats.expiredEntries,
        memoryUsage: cacheStats.memoryUsage,
      },
      recommendations,
      optimizationScore,
    };
  }

  private generateRecommendations(
    performance: any,
    cache: any,
    hitRate: number,
  ): OptimizationReport['recommendations'] {
    const recommendations: OptimizationReport['recommendations'] = [];

    // Performance recommendations
    if (performance.avgResponseTime > 500) {
      recommendations.push({
        type: 'performance',
        severity: performance.avgResponseTime > 1000 ? 'high' : 'medium',
        title: 'High Average Response Time',
        description: `Average response time is ${Math.round(performance.avgResponseTime)}ms, which is above optimal thresholds.`,
        solution:
          'Consider adding database indexes, optimizing queries, or implementing response caching.',
      });
    }

    if (performance.errorRate > 5) {
      recommendations.push({
        type: 'performance',
        severity: performance.errorRate > 10 ? 'critical' : 'high',
        title: 'High Error Rate',
        description: `Error rate is ${performance.errorRate.toFixed(2)}%, indicating potential stability issues.`,
        solution:
          'Review error logs, implement better error handling, and add monitoring alerts.',
      });
    }

    if (performance.slowRequests > performance.totalRequests * 0.1) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'Too Many Slow Requests',
        description: `${performance.slowRequests} requests took longer than 1 second to complete.`,
        solution:
          'Identify and optimize slow endpoints, consider implementing async processing for heavy operations.',
      });
    }

    // Cache recommendations
    if (hitRate < 50) {
      recommendations.push({
        type: 'cache',
        severity: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${hitRate.toFixed(1)}%, indicating ineffective caching strategy.`,
        solution:
          'Review cache TTL settings, identify frequently accessed endpoints, and improve cache keys.',
      });
    }

    if (cache.expiredEntries > cache.totalEntries * 0.3) {
      recommendations.push({
        type: 'cache',
        severity: 'low',
        title: 'High Cache Expiration Rate',
        description:
          'Many cache entries are expiring frequently, reducing cache effectiveness.',
        solution:
          'Adjust TTL values for frequently accessed endpoints and implement smarter cache invalidation.',
      });
    }

    // Database recommendations
    recommendations.push({
      type: 'database',
      severity: 'low',
      title: 'Database Query Optimization',
      description: 'Regular database performance analysis is recommended.',
      solution:
        'Monitor slow queries, ensure proper indexing, and consider connection pooling optimization.',
    });

    // Security recommendations
    recommendations.push({
      type: 'security',
      severity: 'medium',
      title: 'Security Headers Verification',
      description: 'Ensure all security headers are properly configured.',
      solution:
        'Verify CORS settings, CSP headers, and rate limiting configurations.',
    });

    return recommendations;
  }

  private calculateOptimizationScore(
    performance: any,
    hitRate: number,
  ): number {
    let score = 100;

    // Deduct points for poor performance
    if (performance.avgResponseTime > 200) {
      score -= Math.min(30, (performance.avgResponseTime - 200) / 20);
    }

    // Deduct points for high error rate
    if (performance.errorRate > 1) {
      score -= Math.min(25, performance.errorRate * 5);
    }

    // Deduct points for low cache hit rate
    if (hitRate < 70) {
      score -= Math.min(20, (70 - hitRate) / 2);
    }

    // Deduct points for slow requests
    if (performance.slowRequests > 0) {
      const slowRequestPercentage =
        (performance.slowRequests / performance.totalRequests) * 100;
      score -= Math.min(15, slowRequestPercentage * 2);
    }

    // Bonus points for excellent performance
    if (performance.avgResponseTime < 100 && performance.errorRate < 0.5) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateRequestsPerMinute(): number {
    const metrics = this.performanceInterceptor.getMetrics();
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = metrics.filter(
      (metric) => metric.timestamp.getTime() > oneMinuteAgo,
    );
    return recentRequests.length;
  }

  private analyzeAndOptimize(): void {
    const summary = this.performanceInterceptor.getMetricsSummary();

    // Auto-clear cache if hit rate is very low
    const hitRate =
      this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

    if (hitRate < 10 && this.cacheHits + this.cacheMisses > 100) {
      this.logger.warn(
        'Low cache hit rate detected, clearing cache to prevent memory waste',
      );
      this.cacheInterceptor.clearCache();
      this.resetCacheStats();
    }

    // Log performance warnings
    if (summary.avgResponseTime > 1000) {
      this.logger.warn(
        `High average response time: ${summary.avgResponseTime}ms`,
      );
    }

    if (summary.errorRate > 10) {
      this.logger.error(`High error rate detected: ${summary.errorRate}%`);
    }

    // Clean up old performance metrics
    if (summary.totalRequests > 5000) {
      this.logger.debug('Cleaning up old performance metrics');
      this.performanceInterceptor.clearMetrics();
    }
  }

  // Cache tracking methods
  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  resetCacheStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Manual optimization methods
  async optimizeCache(): Promise<{ message: string; clearedEntries: number }> {
    const statsBefore = this.cacheInterceptor.getCacheStats();
    this.cacheInterceptor.clearCache();
    this.resetCacheStats();

    return {
      message: 'Cache optimization completed',
      clearedEntries: statsBefore.totalEntries,
    };
  }

  async optimizePerformance(): Promise<{
    message: string;
    recommendations: string[];
  }> {
    const report = await this.generateOptimizationReport();
    const highPriorityRecommendations = report.recommendations
      .filter((rec) => rec.severity === 'high' || rec.severity === 'critical')
      .map((rec) => rec.title);

    // Clear old metrics to free memory
    this.performanceInterceptor.clearMetrics();

    return {
      message: 'Performance optimization analysis completed',
      recommendations: highPriorityRecommendations,
    };
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  } {
    const summary = this.performanceInterceptor.getMetricsSummary();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (summary.avgResponseTime > 1000) {
      issues.push(
        `High response time: ${Math.round(summary.avgResponseTime)}ms`,
      );
      status = 'critical';
    } else if (summary.avgResponseTime > 500) {
      issues.push(
        `Elevated response time: ${Math.round(summary.avgResponseTime)}ms`,
      );
      status = status === 'healthy' ? 'warning' : status;
    }

    if (summary.errorRate > 10) {
      issues.push(`High error rate: ${summary.errorRate.toFixed(1)}%`);
      status = 'critical';
    } else if (summary.errorRate > 5) {
      issues.push(`Elevated error rate: ${summary.errorRate.toFixed(1)}%`);
      status = status === 'healthy' ? 'warning' : status;
    }

    const hitRate =
      this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

    if (hitRate < 30 && this.cacheHits + this.cacheMisses > 50) {
      issues.push(`Low cache hit rate: ${hitRate.toFixed(1)}%`);
      status = status === 'healthy' ? 'warning' : status;
    }

    return { status, issues };
  }
}
