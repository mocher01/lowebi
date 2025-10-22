import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 300000; // 5 minutes in milliseconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedEntry = this.cache.get(cacheKey);

    // Check if cache is valid
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return of(cachedEntry.data);
    }

    // Cache miss - execute request and cache result
    return next.handle().pipe(
      tap((data) => {
        const ttl = this.getTTLForEndpoint(request.path);
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl,
        });

        this.logger.debug(
          `Cached response for key: ${cacheKey}, TTL: ${ttl}ms`,
        );

        // Clean up expired entries periodically
        this.cleanupExpiredEntries();
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const userId = (request as any).user?.id || 'anonymous';
    const queryString = new URLSearchParams(request.query as any).toString();
    return `${request.path}:${queryString}:${userId}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getTTLForEndpoint(path: string): number {
    // Define different TTL for different endpoints
    const ttlMap: Record<string, number> = {
      '/api/admin/dashboard/stats': 60000, // 1 minute for dashboard stats
      '/api/admin/health': 30000, // 30 seconds for health checks
      '/api/admin/users': 120000, // 2 minutes for user lists
      '/api/admin/sites': 120000, // 2 minutes for site lists
      '/api/admin/monitoring/metrics': 60000, // 1 minute for system metrics
      '/api/admin/monitoring/database': 180000, // 3 minutes for database metrics
      '/api/admin/monitoring/errors': 60000, // 1 minute for error tracking
    };

    // Check for partial matches
    for (const [pattern, ttl] of Object.entries(ttlMap)) {
      if (path.startsWith(pattern)) {
        return ttl;
      }
    }

    return this.defaultTTL;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // Public methods for cache management
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  invalidatePattern(pattern: string): void {
    let invalidatedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    this.logger.log(
      `Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`,
    );
  }

  getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: string;
  } {
    const totalEntries = this.cache.size;
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isCacheValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    // Rough memory usage estimation
    const memoryUsage = `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)} KB`;

    return {
      totalEntries,
      validEntries,
      expiredEntries,
      memoryUsage,
    };
  }
}
