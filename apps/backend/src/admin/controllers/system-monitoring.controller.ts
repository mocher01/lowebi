import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  SystemMonitoringService,
  SystemMetricsDto,
  DatabaseMetricsDto,
  ErrorTrackingDto,
} from '../services/system-monitoring.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@ApiTags('System Monitoring')
@ApiBearerAuth('JWT-auth')
@Controller('admin/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class SystemMonitoringController {
  constructor(
    private readonly systemMonitoringService: SystemMonitoringService,
  ) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get comprehensive system metrics',
    description:
      'Retrieve detailed system performance, memory usage, database status, and application metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        system: {
          type: 'object',
          properties: {
            uptime: { type: 'number' },
            uptimeFormatted: { type: 'string' },
            nodeVersion: { type: 'string' },
            platform: { type: 'string' },
            architecture: { type: 'string' },
            loadAverage: { type: 'array', items: { type: 'number' } },
          },
        },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            total: { type: 'number' },
            free: { type: 'number' },
            percentage: { type: 'number' },
            heapUsed: { type: 'number' },
            heapTotal: { type: 'number' },
            external: { type: 'number' },
          },
        },
        database: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['connected', 'disconnected', 'error'],
            },
            responseTime: { type: 'number' },
          },
        },
        application: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            totalSites: { type: 'number' },
            activeSites: { type: 'number' },
            totalSessions: { type: 'number' },
            activeSessions: { type: 'number' },
            adminActions24h: { type: 'number' },
            pageViews24h: { type: 'number' },
          },
        },
        performance: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            requestsPerMinute: { type: 'number' },
            errorRate: { type: 'number' },
            slowQueries: { type: 'number' },
          },
        },
        security: {
          type: 'object',
          properties: {
            failedLogins24h: { type: 'number' },
            suspiciousActivity: { type: 'number' },
            blockedIPs: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async getSystemMetrics(): Promise<SystemMetricsDto> {
    return this.systemMonitoringService.getSystemMetrics();
  }

  @Get('database')
  @ApiOperation({
    summary: 'Get database performance metrics',
    description:
      'Retrieve detailed database health, performance, and storage information',
  })
  @ApiResponse({
    status: 200,
    description: 'Database metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        connections: {
          type: 'object',
          properties: {
            active: { type: 'number' },
            idle: { type: 'number' },
            total: { type: 'number' },
            max: { type: 'number' },
          },
        },
        performance: {
          type: 'object',
          properties: {
            avgQueryTime: { type: 'number' },
            slowQueries: { type: 'number' },
            locksWaiting: { type: 'number' },
            cacheHitRatio: { type: 'number' },
          },
        },
        storage: {
          type: 'object',
          properties: {
            totalSize: { type: 'string' },
            dataSize: { type: 'string' },
            indexSize: { type: 'string' },
            freeSpace: { type: 'string' },
          },
        },
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              rowCount: { type: 'number' },
              size: { type: 'string' },
              lastAnalyzed: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async getDatabaseMetrics(): Promise<DatabaseMetricsDto> {
    return this.systemMonitoringService.getDatabaseMetrics();
  }

  @Get('errors')
  @ApiOperation({
    summary: 'Get error tracking and analysis',
    description:
      'Retrieve comprehensive error analytics including trends, top errors, and error rates by endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Error tracking data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            total24h: { type: 'number' },
            total7d: { type: 'number' },
            total30d: { type: 'number' },
            currentErrorRate: { type: 'number' },
          },
        },
        topErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              count: { type: 'number' },
              lastOccurrence: { type: 'string', format: 'date-time' },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
            },
          },
        },
        errorsByEndpoint: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              errorCount: { type: 'number' },
              errorRate: { type: 'number' },
            },
          },
        },
        errorTrends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour: { type: 'string' },
              errorCount: { type: 'number' },
              requestCount: { type: 'number' },
              errorRate: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async getErrorTracking(): Promise<ErrorTrackingDto> {
    return this.systemMonitoringService.getErrorTracking();
  }

  @Get('performance')
  @ApiOperation({
    summary: 'Get API performance metrics',
    description:
      'Retrieve detailed API performance analytics including response times, throughput, and endpoint-specific metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'API performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overall: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            requestsPerMinute: { type: 'number' },
            throughput: { type: 'number' },
            errorRate: { type: 'number' },
          },
        },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              avgResponseTime: { type: 'number' },
              requestCount: { type: 'number' },
              errorCount: { type: 'number' },
              slowestRequest: { type: 'number' },
              fastestRequest: { type: 'number' },
            },
          },
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour: { type: 'string' },
              avgResponseTime: { type: 'number' },
              requestCount: { type: 'number' },
              errorCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async getApiPerformance(): Promise<any> {
    // TODO: Implement detailed API performance tracking
    return {
      overall: {
        avgResponseTime: 125.5,
        requestsPerMinute: 45,
        throughput: 750,
        errorRate: 0.02,
      },
      endpoints: [
        {
          endpoint: '/api/admin/users',
          avgResponseTime: 95.2,
          requestCount: 1250,
          errorCount: 3,
          slowestRequest: 850,
          fastestRequest: 25,
        },
        {
          endpoint: '/api/admin/sites',
          avgResponseTime: 180.7,
          requestCount: 890,
          errorCount: 1,
          slowestRequest: 1200,
          fastestRequest: 45,
        },
        {
          endpoint: '/api/auth/login',
          avgResponseTime: 65.3,
          requestCount: 2100,
          errorCount: 12,
          slowestRequest: 300,
          fastestRequest: 15,
        },
      ],
      trends: [
        {
          hour: new Date(Date.now() - 3600000).toISOString(),
          avgResponseTime: 120.5,
          requestCount: 450,
          errorCount: 2,
        },
        {
          hour: new Date(Date.now() - 2 * 3600000).toISOString(),
          avgResponseTime: 135.2,
          requestCount: 520,
          errorCount: 1,
        },
        {
          hour: new Date(Date.now() - 3 * 3600000).toISOString(),
          avgResponseTime: 115.8,
          requestCount: 480,
          errorCount: 0,
        },
      ],
    };
  }
}
