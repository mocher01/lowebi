import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Entities
import { Customer } from './entities/customer.entity';
import { CustomerSettings } from './entities/customer-settings.entity';
import { CustomerActivity } from './entities/customer-activity.entity';
import { CustomerSite } from './entities/customer-site.entity';
import { CustomerSubscription } from './entities/customer-subscription.entity';
import { CustomerUsage } from './entities/customer-usage.entity';
import { CustomerTemplate } from './entities/customer-template.entity';
import { WebsiteWizardSession } from './entities/website-wizard-session.entity';
import { WizardSession } from './entities/wizard-session.entity';
import { GenerationTask } from './entities/generation-task.entity';
import { SiteDomain } from './entities/site-domain.entity';
import { BlogPost } from './entities/blog-post.entity';

// Auth entities (shared)
import { User } from '../auth/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { VerificationToken } from '../auth/entities/password-reset-token.entity';

// Admin entities needed for AI queue service
import { AiRequest } from '../admin/entities/ai-request.entity';

// Controllers
import { CustomerAuthController } from './controllers/customer-auth.controller';
import { CustomerSitesController } from './controllers/customer-sites.controller';
import { CustomerBillingController } from './controllers/customer-billing.controller';
import { CustomerWizardController } from './controllers/customer-wizard.controller';
import { CustomerTemplatesController } from './controllers/customer-templates.controller';
import { WizardSessionController } from './controllers/wizard-session.controller';
import { PublicAiRequestController } from './controllers/public-ai-request.controller';
import { WizardAiRequestController } from './controllers/wizard-ai-request.controller';
import { OAuth2Controller } from './controllers/oauth2.controller';
import { SiteGenerationController } from './controllers/site-generation.controller';
import { CustomerDomainController } from './controllers/domain.controller';

// Services
import { CustomerAuthService } from './services/customer-auth.service';
import { CustomerSitesService } from './services/customer-sites.service';
import { CustomerBillingService } from './services/customer-billing.service';
import { CustomerWizardService } from './services/customer-wizard.service';
import { CustomerTemplatesService } from './services/customer-templates.service';
import { WizardSessionService } from './services/wizard-session.service';
import { AiQueueService } from '../admin/services/ai-queue.service';
import { WizardDataMapperService } from './services/wizard-data-mapper.service';
import { SiteGenerationOrchestratorService } from './services/site-generation-orchestrator.service';
import { SiteContentService } from './services/site-content.service';

// Note: Public AI request controller will be moved to avoid circular dependency

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Customer entities
      Customer,
      CustomerSettings,
      CustomerActivity,
      CustomerSite,
      CustomerSubscription,
      CustomerUsage,
      CustomerTemplate,
      WebsiteWizardSession,
      WizardSession,
      GenerationTask,
      SiteDomain,
      BlogPost,
      // Shared auth entities
      User,
      Session,
      VerificationToken,
      // Admin entities for AI queue service
      AiRequest,
    ]),
    AuthModule, // Import auth module for JWT strategy
    forwardRef(() => AdminModule), // Import admin module for AI queue services
    InfrastructureModule, // Import infrastructure module for domain management
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'customer-jwt-secret-key',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    CustomerAuthController,
    CustomerSitesController,
    CustomerBillingController,
    CustomerWizardController,
    CustomerTemplatesController,
    WizardSessionController,
    WizardAiRequestController, // Proper authenticated wizard AI requests
    OAuth2Controller,
    SiteGenerationController, // Step 7: Site Generation
    CustomerDomainController, // Domain management
    // PublicAiRequestController, // Temporarily disabled to avoid circular dependency
  ],
  providers: [
    CustomerAuthService,
    CustomerSitesService,
    CustomerBillingService,
    CustomerWizardService,
    CustomerTemplatesService,
    WizardSessionService,
    AiQueueService,
    WizardDataMapperService,
    SiteGenerationOrchestratorService,
    SiteContentService,
  ],
  exports: [
    CustomerAuthService,
    CustomerSitesService,
    CustomerBillingService,
    CustomerWizardService,
    CustomerTemplatesService,
    WizardSessionService,
    SiteGenerationOrchestratorService,
  ],
})
export class CustomerModule {}
