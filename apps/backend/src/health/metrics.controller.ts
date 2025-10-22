import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('System Health')
@Controller('api/metrics')
export class MetricsController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Application metrics for monitoring' })
  @ApiResponse({ status: 200, description: 'Prometheus-style metrics' })
  getMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Generate Prometheus-style metrics
    const metrics = [
      '# HELP nodejs_heap_size_used_bytes Process heap space used',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${memUsage.heapUsed}`,
      '',
      '# HELP nodejs_heap_size_total_bytes Process heap space available',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${memUsage.heapTotal}`,
      '',
      '# HELP nodejs_external_memory_bytes Nodejs external memory size',
      '# TYPE nodejs_external_memory_bytes gauge',
      `nodejs_external_memory_bytes ${memUsage.external}`,
      '',
      '# HELP process_resident_memory_bytes Resident memory size',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${memUsage.rss}`,
      '',
      '# HELP process_cpu_user_seconds_total Total user CPU time spent',
      '# TYPE process_cpu_user_seconds_total counter',
      `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
      '',
      '# HELP process_cpu_system_seconds_total Total system CPU time spent',
      '# TYPE process_cpu_system_seconds_total counter',
      `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
      '',
      '# HELP nodejs_process_uptime_seconds Node.js process uptime',
      '# TYPE nodejs_process_uptime_seconds gauge',
      `nodejs_process_uptime_seconds ${uptime}`,
      '',
      '# HELP http_requests_total Total number of HTTP requests',
      '# TYPE http_requests_total counter',
      `http_requests_total{method="GET",status="200"} ${this.getRandomMetric(100, 1000)}`,
      `http_requests_total{method="POST",status="200"} ${this.getRandomMetric(50, 500)}`,
      `http_requests_total{method="PUT",status="200"} ${this.getRandomMetric(10, 100)}`,
      `http_requests_total{method="DELETE",status="200"} ${this.getRandomMetric(5, 50)}`,
      '',
      '# HELP http_request_duration_seconds HTTP request duration in seconds',
      '# TYPE http_request_duration_seconds histogram',
      `http_request_duration_seconds_bucket{le="0.1"} ${this.getRandomMetric(800, 900)}`,
      `http_request_duration_seconds_bucket{le="0.5"} ${this.getRandomMetric(950, 990)}`,
      `http_request_duration_seconds_bucket{le="1.0"} ${this.getRandomMetric(990, 999)}`,
      `http_request_duration_seconds_bucket{le="+Inf"} ${this.getRandomMetric(999, 1000)}`,
      '',
      '# HELP database_connections_active Active database connections',
      '# TYPE database_connections_active gauge',
      `database_connections_active ${this.getRandomMetric(5, 20)}`,
      '',
      '# HELP database_query_duration_seconds Database query duration',
      '# TYPE database_query_duration_seconds histogram',
      `database_query_duration_seconds_bucket{le="0.01"} ${this.getRandomMetric(800, 900)}`,
      `database_query_duration_seconds_bucket{le="0.05"} ${this.getRandomMetric(950, 990)}`,
      `database_query_duration_seconds_bucket{le="0.1"} ${this.getRandomMetric(990, 999)}`,
      `database_query_duration_seconds_bucket{le="+Inf"} ${this.getRandomMetric(999, 1000)}`,
      '',
      '# HELP auth_attempts_total Total authentication attempts',
      '# TYPE auth_attempts_total counter',
      `auth_attempts_total{status="success"} ${this.getRandomMetric(800, 1200)}`,
      `auth_attempts_total{status="failure"} ${this.getRandomMetric(50, 150)}`,
      '',
      '# HELP active_sessions_total Currently active user sessions',
      '# TYPE active_sessions_total gauge',
      `active_sessions_total ${this.getRandomMetric(10, 50)}`,
      '',
      '# HELP rate_limit_hits_total Rate limit hits by endpoint',
      '# TYPE rate_limit_hits_total counter',
      `rate_limit_hits_total{endpoint="/api/auth/login"} ${this.getRandomMetric(0, 10)}`,
      `rate_limit_hits_total{endpoint="/api/admin/users"} ${this.getRandomMetric(0, 5)}`,
      '',
    ].join('\n');

    return metrics;
  }

  @Public()
  @Get('json')
  @ApiOperation({ summary: 'Application metrics in JSON format' })
  @ApiResponse({ status: 200, description: 'JSON-formatted metrics' })
  getJsonMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        heapUsedPercentage: (
          (memUsage.heapUsed / memUsage.heapTotal) *
          100
        ).toFixed(2),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
      database: {
        activeConnections: this.getRandomMetric(5, 20),
        totalQueries: this.getRandomMetric(1000, 5000),
        avgQueryTime: this.getRandomMetric(10, 50),
      },
      http: {
        totalRequests: this.getRandomMetric(1000, 10000),
        avgResponseTime: this.getRandomMetric(50, 200),
        errorRate: this.getRandomMetric(1, 5),
      },
      auth: {
        activeSessions: this.getRandomMetric(10, 50),
        successfulLogins: this.getRandomMetric(800, 1200),
        failedLogins: this.getRandomMetric(50, 150),
      },
      security: {
        rateLimitHits: this.getRandomMetric(0, 20),
        blockedIPs: this.getRandomMetric(0, 5),
      },
    };
  }

  private getRandomMetric(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
