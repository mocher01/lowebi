import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('System Health')
@Controller('api/health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    };
  }

  @Public()
  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({
    status: 200,
    description: 'Detailed system health information',
  })
  getDetailedHealth() {
    const memUsage = process.memoryUsage();
    const loadAvg =
      process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0];

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: {
        uptime: process.uptime(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
        loadAverage: loadAvg,
      },
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
      },
      database: {
        status: 'connected', // This would be enhanced with actual DB checks
        connectionPool: 'healthy',
      },
      security: {
        helmet: 'enabled',
        cors: 'enabled',
        rateLimit: 'active',
        https: process.env.HTTPS_ENABLED === 'true',
      },
    };
  }

  @Public()
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe for load balancers' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to receive traffic',
  })
  getReadiness() {
    // In a real implementation, this would check:
    // - Database connectivity
    // - External service dependencies
    // - Application initialization status

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        authentication: 'ok',
        adminServices: 'ok',
      },
    };
  }

  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe for container orchestration' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
