import {
  Controller,
  Get,
  Post,
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
  ApiOptimizationService,
  OptimizationReport,
} from '../../common/services/api-optimization.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@ApiTags('API Optimization')
@ApiBearerAuth('JWT-auth')
@Controller('admin/optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class ApiOptimizationController {
  constructor(
    private readonly apiOptimizationService: ApiOptimizationService,
  ) {}

  @Get('report')
  @ApiOperation({
    summary: 'Get comprehensive optimization report',
    description:
      'Generate detailed performance analysis and optimization recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Optimization report generated successfully',
    schema: {
      type: 'object',
      properties: {
        performance: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            slowRequests: { type: 'number' },
            errorRate: { type: 'number' },
            requestsPerMinute: { type: 'number' },
            topSlowEndpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  avgResponseTime: { type: 'number' },
                  requestCount: { type: 'number' },
                },
              },
            },
          },
        },
        cache: {
          type: 'object',
          properties: {
            hitRate: { type: 'number' },
            totalEntries: { type: 'number' },
            validEntries: { type: 'number' },
            expiredEntries: { type: 'number' },
            memoryUsage: { type: 'string' },
          },
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['performance', 'cache', 'database', 'security'],
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              title: { type: 'string' },
              description: { type: 'string' },
              solution: { type: 'string' },
            },
          },
        },
        optimizationScore: { type: 'number', minimum: 0, maximum: 100 },
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
  async getOptimizationReport(): Promise<OptimizationReport> {
    return this.apiOptimizationService.generateOptimizationReport();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get API health status',
    description:
      'Check the current health status of the API with performance indicators',
  })
  @ApiResponse({
    status: 200,
    description: 'API health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        issues: { type: 'array', items: { type: 'string' } },
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
  async getApiHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  }> {
    return this.apiOptimizationService.getHealthStatus();
  }

  @Post('cache/optimize')
  @ApiOperation({
    summary: 'Optimize cache performance',
    description: 'Clear expired cache entries and reset cache statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache optimization completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        clearedEntries: { type: 'number' },
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
  async optimizeCache(): Promise<{ message: string; clearedEntries: number }> {
    return this.apiOptimizationService.optimizeCache();
  }

  @Post('performance/optimize')
  @ApiOperation({
    summary: 'Optimize API performance',
    description:
      'Analyze performance metrics and generate optimization recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance optimization analysis completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
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
  async optimizePerformance(): Promise<{
    message: string;
    recommendations: string[];
  }> {
    return this.apiOptimizationService.optimizePerformance();
  }

  @Get('metrics/performance')
  @ApiOperation({
    summary: 'Get detailed performance metrics',
    description: 'Retrieve comprehensive API performance analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalRequests: { type: 'number' },
            avgResponseTime: { type: 'number' },
            slowRequests: { type: 'number' },
            errorRate: { type: 'number' },
            topEndpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  avgResponseTime: { type: 'number' },
                  requestCount: { type: 'number' },
                },
              },
            },
          },
        },
        recentMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              responseTime: { type: 'number' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
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
  async getPerformanceMetrics(): Promise<any> {
    // Note: This would need to be implemented in the ApiOptimizationService
    // For now, returning a placeholder structure
    return {
      summary: {
        totalRequests: 1250,
        avgResponseTime: 185.5,
        slowRequests: 23,
        errorRate: 1.2,
        topEndpoints: [
          {
            endpoint: '/api/admin/users',
            avgResponseTime: 95.2,
            requestCount: 450,
          },
          {
            endpoint: '/api/admin/sites',
            avgResponseTime: 180.7,
            requestCount: 320,
          },
          {
            endpoint: '/api/auth/login',
            avgResponseTime: 65.3,
            requestCount: 480,
          },
        ],
      },
      recentMetrics: [
        {
          endpoint: '/api/admin/dashboard/stats',
          method: 'GET',
          responseTime: 125,
          statusCode: 200,
          timestamp: new Date().toISOString(),
        },
        {
          endpoint: '/api/admin/users',
          method: 'GET',
          responseTime: 89,
          statusCode: 200,
          timestamp: new Date(Date.now() - 30000).toISOString(),
        },
      ],
    };
  }

  @Get('metrics/cache')
  @ApiOperation({
    summary: 'Get detailed cache metrics',
    description: 'Retrieve comprehensive cache performance analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hitRate: { type: 'number' },
        totalEntries: { type: 'number' },
        validEntries: { type: 'number' },
        expiredEntries: { type: 'number' },
        memoryUsage: { type: 'string' },
        cacheDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              entries: { type: 'number' },
              hitRate: { type: 'number' },
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
  async getCacheMetrics(): Promise<any> {
    // Note: This would need to be implemented in the ApiOptimizationService
    // For now, returning a placeholder structure
    return {
      hitRate: 68.5,
      totalEntries: 245,
      validEntries: 198,
      expiredEntries: 47,
      memoryUsage: '12.5 KB',
      cacheDistribution: [
        {
          endpoint: '/api/admin/dashboard/stats',
          entries: 45,
          hitRate: 85.2,
        },
        {
          endpoint: '/api/admin/users',
          entries: 78,
          hitRate: 72.1,
        },
        {
          endpoint: '/api/admin/sites',
          entries: 56,
          hitRate: 64.8,
        },
      ],
    };
  }
}
