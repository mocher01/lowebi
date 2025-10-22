import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CustomerSite, SiteStatus } from '../entities/customer-site.entity';
import { CustomerSubscription } from '../entities/customer-subscription.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';
import {
  CreateCustomerSiteDto,
  UpdateCustomerSiteDto,
  CustomerSiteResponseDto,
  DeploySiteDto,
  SiteDeploymentStatusDto,
} from '../dto/customer-site.dto';

@Injectable()
export class CustomerSitesService {
  constructor(
    @InjectRepository(CustomerSite)
    private readonly siteRepository: Repository<CustomerSite>,
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(CustomerUsage)
    private readonly usageRepository: Repository<CustomerUsage>,
  ) {}

  async listSites(
    customerId: string,
    options: { page: number; limit: number; status?: string; search?: string },
  ): Promise<{
    sites: CustomerSiteResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, status, search } = options;
    const offset = (page - 1) * limit;

    let whereConditions: any = { customerId };

    if (status) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions = [
        { ...whereConditions, name: Like(`%${search}%`) },
        { ...whereConditions, domain: Like(`%${search}%`) },
      ];
    }

    const [sites, total] = await this.siteRepository.findAndCount({
      where: whereConditions,
      order: { updatedAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      sites: sites.map((site) => this.transformSiteToResponse(site)),
      total,
      page,
      limit,
    };
  }

  async createSite(
    customerId: string,
    createSiteDto: CreateCustomerSiteDto,
  ): Promise<CustomerSiteResponseDto> {
    // Check subscription limits
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    // Check if user has reached site limit
    const currentSiteCount = await this.siteRepository.count({
      where: { customerId },
    });

    if (currentSiteCount >= subscription.sitesLimit) {
      throw new ForbiddenException('Site limit reached for current plan');
    }

    // Check if domain is available
    const existingDomain = await this.siteRepository.findOne({
      where: { domain: createSiteDto.domain },
    });

    if (existingDomain) {
      throw new BadRequestException('Domain already taken');
    }

    // Create site
    const site = this.siteRepository.create({
      name: createSiteDto.name,
      domain: createSiteDto.domain,
      customerId,
      status: SiteStatus.DRAFT,
    });

    const savedSite = await this.siteRepository.save(site);

    // Track usage
    await this.trackUsage(customerId, UsageType.SITE_CREATION, 1, savedSite.id);

    return this.transformSiteToResponse(savedSite);
  }

  async getSite(
    customerId: string,
    siteId: string,
  ): Promise<CustomerSiteResponseDto> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return this.transformSiteToResponse(site);
  }

  async updateSite(
    customerId: string,
    siteId: string,
    updateSiteDto: UpdateCustomerSiteDto,
  ): Promise<CustomerSiteResponseDto> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    // Check custom domain permission
    if (updateSiteDto.customDomain) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { customerId },
      });

      if (!subscription?.customDomainAllowed) {
        throw new ForbiddenException(
          'Custom domains not allowed in current plan',
        );
      }
    }

    // Update site
    Object.assign(site, updateSiteDto);
    const updatedSite = await this.siteRepository.save(site);

    return this.transformSiteToResponse(updatedSite);
  }

  async deleteSite(customerId: string, siteId: string): Promise<void> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    // Soft delete - mark as inactive
    site.isActive = false;
    site.status = SiteStatus.SUSPENDED;
    await this.siteRepository.save(site);

    // TODO: Implement cleanup of deployed resources
    await this.cleanupDeployedResources(site);
  }

  async deploySite(
    customerId: string,
    siteId: string,
    deployDto: DeploySiteDto,
  ): Promise<SiteDeploymentStatusDto> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (!site.configuration || !site.content) {
      throw new BadRequestException(
        'Site configuration and content required for deployment',
      );
    }

    // Update site status
    site.status = SiteStatus.BUILDING;
    site.deploymentStatus = 'building';
    await this.siteRepository.save(site);

    // Start deployment process (async)
    this.startDeploymentProcess(site, deployDto);

    return {
      id: site.id,
      deploymentStatus: 'building',
      deploymentUrl: site.deploymentUrl,
      lastDeployedAt: site.lastDeployedAt,
      message: 'Deployment started successfully',
    };
  }

  async getDeploymentStatus(
    customerId: string,
    siteId: string,
  ): Promise<SiteDeploymentStatusDto> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return {
      id: site.id,
      deploymentStatus: site.deploymentStatus || 'unknown',
      deploymentUrl: site.deploymentUrl,
      lastDeployedAt: site.lastDeployedAt,
      message: this.getStatusMessage(site.deploymentStatus),
    };
  }

  async generatePreview(
    customerId: string,
    siteId: string,
  ): Promise<{ previewUrl: string; expiresAt: Date }> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    // Generate temporary preview URL
    const previewToken = this.generatePreviewToken();
    const previewUrl = `https://preview.logen.com/${site.domain}?token=${previewToken}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // TODO: Store preview token and implement preview service

    return { previewUrl, expiresAt };
  }

  async getSiteAnalytics(
    customerId: string,
    siteId: string,
    period: string,
  ): Promise<any> {
    const site = await this.siteRepository.findOne({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // TODO: Implement proper analytics data collection
    // For now, return mock data
    return {
      period,
      startDate,
      endDate,
      metrics: {
        pageViews: site.pageViews || 0,
        visitors: site.visitorCount || 0,
        bounceRate: 0.45,
        avgSessionDuration: 180, // seconds
      },
      dailyStats: this.generateMockDailyStats(startDate, endDate),
      topPages: [
        { path: '/', views: Math.floor(site.pageViews * 0.6) || 50 },
        { path: '/about', views: Math.floor(site.pageViews * 0.2) || 20 },
        { path: '/services', views: Math.floor(site.pageViews * 0.15) || 15 },
        { path: '/contact', views: Math.floor(site.pageViews * 0.05) || 5 },
      ],
    };
  }

  private transformSiteToResponse(site: CustomerSite): CustomerSiteResponseDto {
    return {
      id: site.id,
      name: site.name,
      description: site.description || '',
      businessType: site.businessType || '',
      domain: site.domain,
      status: site.status,
      deploymentUrl: site.deploymentUrl || '',
      deploymentStatus: site.status,
      lastDeployedAt: site.lastDeployedAt,
      isActive: site.isActive,
      visitorCount: 0, // Not tracked in simplified schema
      pageViews: 0, // Not tracked in simplified schema
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  }

  private async trackUsage(
    customerId: string,
    type: UsageType,
    amount: number,
    siteId?: string,
  ): Promise<void> {
    const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const usage = this.usageRepository.create({
      customerId,
      type,
      amount,
      unit: type === UsageType.SITE_CREATION ? 'count' : 'bytes',
      billingPeriod,
      siteId,
    });

    await this.usageRepository.save(usage);
  }

  private async startDeploymentProcess(
    site: CustomerSite,
    deployDto: DeploySiteDto,
  ): Promise<void> {
    try {
      // TODO: Implement actual deployment logic
      // This would integrate with your V1 website generation system

      // Simulate deployment delay
      setTimeout(async () => {
        site.status = SiteStatus.DEPLOYED;
        site.deploymentStatus = 'deployed';
        site.deploymentUrl = `https://${site.domain}.logen.com`;
        site.lastDeployedAt = new Date();
        await this.siteRepository.save(site);
      }, 5000); // 5 second delay
    } catch (error) {
      site.status = SiteStatus.ERROR;
      site.deploymentStatus = 'failed';
      await this.siteRepository.save(site);
    }
  }

  private async cleanupDeployedResources(site: CustomerSite): Promise<void> {
    // TODO: Implement cleanup of deployed resources
    // Remove deployed site, clear CDN cache, etc.
    console.log(`Cleaning up resources for site: ${site.domain}`);
  }

  private getStatusMessage(status?: string): string {
    switch (status) {
      case 'building':
        return 'Deployment in progress';
      case 'deployed':
        return 'Site successfully deployed';
      case 'failed':
        return 'Deployment failed';
      default:
        return 'Status unknown';
    }
  }

  private generatePreviewToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateMockDailyStats(
    startDate: Date,
    endDate: Date,
  ): Array<{ date: string; pageViews: number; visitors: number }> {
    const stats: Array<{ date: string; pageViews: number; visitors: number }> =
      [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      stats.push({
        date: currentDate.toISOString().split('T')[0],
        pageViews: Math.floor(Math.random() * 100) + 10,
        visitors: Math.floor(Math.random() * 50) + 5,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return stats;
  }
}
