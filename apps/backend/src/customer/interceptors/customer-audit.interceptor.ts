import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CustomerAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Log customer activity
          this.logCustomerActivity({
            customerId: user?.id,
            method,
            url,
            userAgent,
            ip,
            duration,
            timestamp: new Date(),
            success: true,
            responseSize: JSON.stringify(response).length,
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Log failed requests
          this.logCustomerActivity({
            customerId: user?.id,
            method,
            url,
            userAgent,
            ip,
            duration,
            timestamp: new Date(),
            success: false,
            error: error.message,
          });
        },
      }),
    );
  }

  private logCustomerActivity(activity: any): void {
    // TODO: Implement proper audit logging to database or external service
    // For now, log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[CUSTOMER AUDIT]', {
        timestamp: activity.timestamp.toISOString(),
        customerId: activity.customerId,
        method: activity.method,
        url: activity.url,
        duration: `${activity.duration}ms`,
        success: activity.success,
        ip: activity.ip,
        error: activity.error,
      });
    }

    // In production, this would save to an audit log table or service
    // Example structure:
    // await this.auditRepository.save({
    //   customerId: activity.customerId,
    //   action: `${activity.method} ${activity.url}`,
    //   ipAddress: activity.ip,
    //   userAgent: activity.userAgent,
    //   duration: activity.duration,
    //   success: activity.success,
    //   errorMessage: activity.error,
    //   createdAt: activity.timestamp,
    // });
  }
}
