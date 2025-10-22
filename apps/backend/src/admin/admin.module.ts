import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CustomerModule } from '../customer/customer.module';
import { SiteManagementController } from './controllers/site-management.controller';
import { SiteManagementService } from './services/site-management.service';
// import { SystemMonitoringController } from './controllers/system-monitoring.controller'; // Disabled - V2 entity dependency
// import { SystemMonitoringService } from './services/system-monitoring.service'; // Disabled - V2 entity dependency
import { ApiOptimizationController } from './controllers/api-optimization.controller';
import { ApiOptimizationService } from '../common/services/api-optimization.service';
import { AiQueueController } from './controllers/ai-queue.controller';
import { AiQueueService } from './services/ai-queue.service';
import { ImageDraftController } from './controllers/image-draft.controller';
import { PerformanceInterceptor } from '../common/interceptors/performance.interceptor';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';
import { User } from '../auth/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CustomerSite } from '../customer/entities/customer-site.entity';
import { SiteAnalytics } from './entities/site-analytics.entity';
import { AiRequest } from './entities/ai-request.entity';
import { AdminActivityLog } from './entities/admin-activity-log.entity';
import { AiRequestHistory } from './entities/ai-request-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Session,
      AuditLog,
      CustomerSite,
      SiteAnalytics,
      AiRequest,
      AdminActivityLog,
      AiRequestHistory,
    ]),
    forwardRef(() => CustomerModule),
  ],
  controllers: [
    AdminController,
    SiteManagementController,
    // SystemMonitoringController, // Disabled - V2 entity dependency
    AiQueueController,
    ImageDraftController,
  ], // ApiOptimizationController],
  providers: [
    AdminService,
    SiteManagementService,
    // SystemMonitoringService, // Disabled - V2 entity dependency
    AiQueueService,
    ApiOptimizationService,
    PerformanceInterceptor,
    CacheInterceptor,
  ],
  exports: [
    AdminService,
    SiteManagementService,
    // SystemMonitoringService, // Disabled - V2 entity dependency
    AiQueueService,
    ApiOptimizationService,
    PerformanceInterceptor,
    CacheInterceptor,
  ],
})
export class AdminModule {}
