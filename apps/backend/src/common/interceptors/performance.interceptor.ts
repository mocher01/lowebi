import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private metrics: PerformanceMetric[] = [];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const endpoint = request.route?.path || request.path;
    const method = request.method;

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetric(request, response, startTime, endpoint, method);
        },
        error: (error) => {
          this.recordMetric(
            request,
            response,
            startTime,
            endpoint,
            method,
            error,
          );
        },
      }),
    );
  }

  private recordMetric(
    request: Request,
    response: Response,
    startTime: number,
    endpoint: string,
    method: string,
    error?: any,
  ): void {
    const responseTime = Date.now() - startTime;
    const statusCode = error ? 500 : response.statusCode;

    const metric: PerformanceMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date(),
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      userId: (request as any).user?.id,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log slow requests
    if (responseTime > 1000) {
      this.logger.warn(
        `Slow request detected: ${method} ${endpoint} - ${responseTime}ms`,
      );
    }

    // Log errors
    if (error) {
      this.logger.error(
        `Request failed: ${method} ${endpoint} - ${responseTime}ms`,
        error.stack,
      );
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsSummary(): {
    totalRequests: number;
    avgResponseTime: number;
    slowRequests: number;
    errorRate: number;
    topEndpoints: Array<{
      endpoint: string;
      avgResponseTime: number;
      requestCount: number;
    }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        topEndpoints: [],
      };
    }

    const totalRequests = this.metrics.length;
    const totalResponseTime = this.metrics.reduce(
      (sum, metric) => sum + metric.responseTime,
      0,
    );
    const avgResponseTime = totalResponseTime / totalRequests;
    const slowRequests = this.metrics.filter(
      (metric) => metric.responseTime > 1000,
    ).length;
    const errorRequests = this.metrics.filter(
      (metric) => metric.statusCode >= 400,
    ).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    // Calculate top endpoints
    const endpointStats = new Map<
      string,
      { totalTime: number; count: number }
    >();

    this.metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      existing.totalTime += metric.responseTime;
      existing.count++;
      endpointStats.set(key, existing);
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        requestCount: stats.count,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    return {
      totalRequests,
      avgResponseTime,
      slowRequests,
      errorRate,
      topEndpoints,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}
