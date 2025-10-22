import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SiteDomain } from '../customer/entities/site-domain.entity';
import { WizardSession } from '../customer/entities/wizard-session.entity';
import { DomainManagementService } from './domain-management.service';
import { NginxConfigService } from './nginx-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteDomain, WizardSession]),
    ConfigModule,
  ],
  providers: [DomainManagementService, NginxConfigService],
  exports: [DomainManagementService, NginxConfigService],
})
export class InfrastructureModule {}
