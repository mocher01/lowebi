import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  CustomerSite,
  SiteStatus,
} from '../../customer/entities/customer-site.entity';
import {
  SiteAnalytics,
  AnalyticsEventType,
} from '../entities/site-analytics.entity';
import { User } from '../../auth/entities/user.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteListQueryDto,
  SiteResponseDto,
  SiteListResponseDto,
  SiteAnalyticsQueryDto,
  SiteAnalyticsResponseDto,
  AdminDeploySiteDto,
  BulkSiteOperationDto,
} from '../dto/site-management.dto';

@Injectable()
export class SiteManagementService {
  private readonly logger = new Logger(SiteManagementService.name);

  constructor(
    @InjectRepository(CustomerSite)
    private siteRepository: Repository<CustomerSite>,
    @InjectRepository(SiteAnalytics)
    private analyticsRepository: Repository<SiteAnalytics>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  // Site CRUD Operations
  async createSite(
    createSiteDto: CreateSiteDto,
    adminUserId: string,
  ): Promise<SiteResponseDto> {
    // Check if domain already exists
    const existingSite = await this.siteRepository.findOne({
      where: { domain: createSiteDto.domain },
    });

    if (existingSite) {
      throw new BadRequestException('Domain already exists');
    }

    // Verify user exists if userId is provided
    let targetUserId = createSiteDto.userId;
    if (!targetUserId) {
      // If no userId provided, assign to admin (for admin-created sites)
      targetUserId = adminUserId;
    } else {
      const user = await this.userRepository.findOne({
        where: { id: targetUserId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${targetUserId} not found`);
      }
    }

    const site = new CustomerSite({
      name: createSiteDto.name,
      domain: createSiteDto.domain,
      description: createSiteDto.description || '',
      businessType: createSiteDto.businessType,
      customerId: targetUserId,
      status: SiteStatus.DRAFT,
    });

    const savedSite = await this.siteRepository.save(site);

    // Log admin action
    await this.logAdminAction(
      AuditAction.SITE_CREATED,
      adminUserId,
      targetUserId,
      'site',
      { siteId: savedSite.id, domain: savedSite.domain },
    );

    return this.getSiteById(savedSite.id);
  }

  async getSites(query: SiteListQueryDto): Promise<SiteListResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      template,
      isActive,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.siteRepository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.customer', 'customer');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(site.name ILIKE :search OR site.domain ILIKE :search OR site.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('site.status = :status', { status });
    }

    // Note: CustomerSite doesn't have template field, ignoring template filter
    // if (template) {
    //   queryBuilder.andWhere('site.template = :template', { template });
    // }

    if (isActive !== undefined) {
      queryBuilder.andWhere('site.isActive = :isActive', { isActive });
    }

    if (userId) {
      queryBuilder.andWhere('site.customerId = :userId', { userId });
    }

    // Apply sorting
    queryBuilder.orderBy(`site.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [sites, total] = await queryBuilder.getManyAndCount();

    const siteResponses: SiteResponseDto[] = sites.map((site) => ({
      id: site.id,
      name: site.name,
      domain: site.domain,
      description: site.description || '',
      template: null, // CustomerSite doesn't have template field
      status: site.status,
      configuration: site.configuration,
      metadata: null, // CustomerSite doesn't have metadata field
      buildPath: null, // CustomerSite doesn't have buildPath field
      deploymentUrl: site.deploymentUrl || '',
      lastDeployedAt: site.lastDeployedAt || new Date(),
      pageViews: Number(site.pageViews),
      uniqueVisitors: site.visitorCount || 0,
      isActive: site.isActive,
      userId: site.customerId,
      userEmail: site.customer.email,
      userFullName:
        `${site.customer.firstName || ''} ${site.customer.lastName || ''}`.trim() ||
        site.customer.email,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    }));

    return {
      sites: siteResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSiteById(id: string): Promise<SiteResponseDto> {
    const site = await this.siteRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return {
      id: site.id,
      name: site.name,
      domain: site.domain,
      description: site.description || '',
      template: null, // CustomerSite doesn't have template field
      status: site.status,
      configuration: site.configuration,
      metadata: null, // CustomerSite doesn't have metadata field
      buildPath: null, // CustomerSite doesn't have buildPath field
      deploymentUrl: site.deploymentUrl || '',
      lastDeployedAt: site.lastDeployedAt || new Date(),
      pageViews: Number(site.pageViews),
      uniqueVisitors: site.visitorCount || 0,
      isActive: site.isActive,
      userId: site.customerId,
      userEmail: site.customer.email,
      userFullName:
        `${site.customer.firstName || ''} ${site.customer.lastName || ''}`.trim() ||
        site.customer.email,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  }

  async updateSite(
    id: string,
    updateSiteDto: UpdateSiteDto,
    adminUserId: string,
  ): Promise<SiteResponseDto> {
    const site = await this.siteRepository.findOne({ where: { id } });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Check if domain is being changed and if it already exists
    if (updateSiteDto.domain && updateSiteDto.domain !== site.domain) {
      const existingSite = await this.siteRepository.findOne({
        where: { domain: updateSiteDto.domain },
      });
      if (existingSite) {
        throw new BadRequestException('Domain already exists');
      }
    }

    // Update site fields
    Object.assign(site, updateSiteDto);
    await this.siteRepository.save(site);

    // Log admin action
    await this.logAdminAction(
      AuditAction.SITE_UPDATED,
      adminUserId,
      site.customerId,
      'site',
      { siteId: id, updatedFields: Object.keys(updateSiteDto) },
    );

    return this.getSiteById(id);
  }

  async deleteSite(id: string, adminUserId: string): Promise<void> {
    const site = await this.siteRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Soft delete by archiving
    site.status = SiteStatus.SUSPENDED;
    site.isActive = false;
    await this.siteRepository.save(site);

    // Log admin action
    await this.logAdminAction(
      AuditAction.SITE_DELETED,
      adminUserId,
      site.customerId,
      'site',
      { siteId: id, domain: site.domain },
    );
  }

  // Site Deployment
  async deploySite(
    id: string,
    deploySiteDto: AdminDeploySiteDto,
    adminUserId: string,
  ): Promise<{ message: string; deploymentId?: string }> {
    const site = await this.siteRepository.findOne({ where: { id } });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    if (!site.isActive) {
      throw new BadRequestException('Cannot deploy inactive site');
    }

    // Update site status to deploying
    site.status = SiteStatus.BUILDING;
    await this.siteRepository.save(site);

    // Log admin action
    await this.logAdminAction(
      AuditAction.SITE_DEPLOYED,
      adminUserId,
      site.customerId,
      'site',
      {
        siteId: id,
        domain: site.domain,
        environment: deploySiteDto.environment,
        forceRebuild: deploySiteDto.forceRebuild,
      },
    );

    // TODO: Integrate with actual deployment service
    // This would trigger the deployment pipeline

    return {
      message: 'Site deployment initiated successfully',
      deploymentId: `deploy_${Date.now()}_${id.slice(0, 8)}`,
    };
  }

  // Site Analytics
  async getSiteAnalytics(
    id: string,
    query: SiteAnalyticsQueryDto,
  ): Promise<SiteAnalyticsResponseDto> {
    const site = await this.siteRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    const { startDate, endDate, granularity = 'day' } = query;

    // Build date filters
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.siteId = :siteId', { siteId: id });

    if (startDate) {
      queryBuilder.andWhere('analytics.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('analytics.timestamp <= :endDate', { endDate });
    }

    // Get basic metrics
    const [totalPageViews, uniqueVisitors] = await Promise.all([
      queryBuilder
        .clone()
        .andWhere('analytics.eventType = :eventType', {
          eventType: AnalyticsEventType.PAGE_VIEW,
        })
        .getCount(),
      queryBuilder
        .clone()
        .select('COUNT(DISTINCT analytics.visitorId)', 'count')
        .getRawOne()
        .then((result) => parseInt(result.count)),
    ]);

    // Get top pages
    const topPagesResult = await queryBuilder
      .clone()
      .select('analytics.page', 'page')
      .addSelect('COUNT(*)', 'views')
      .andWhere('analytics.eventType = :eventType', {
        eventType: AnalyticsEventType.PAGE_VIEW,
      })
      .groupBy('analytics.page')
      .orderBy('views', 'DESC')
      .limit(10)
      .getRawMany();

    const topPages = topPagesResult.map((result) => ({
      page: result.page,
      views: parseInt(result.views),
      percentage:
        totalPageViews > 0
          ? (parseInt(result.views) / totalPageViews) * 100
          : 0,
    }));

    // Get traffic sources
    const trafficSourcesResult = await queryBuilder
      .clone()
      .select("COALESCE(analytics.referrer, 'Direct')", 'source')
      .addSelect('COUNT(DISTINCT analytics.visitorId)', 'visitors')
      .groupBy('source')
      .orderBy('visitors', 'DESC')
      .limit(10)
      .getRawMany();

    const trafficSources = trafficSourcesResult.map((result) => ({
      source: result.source,
      visitors: parseInt(result.visitors),
      percentage:
        uniqueVisitors > 0
          ? (parseInt(result.visitors) / uniqueVisitors) * 100
          : 0,
    }));

    // Get device breakdown
    const deviceBreakdownResult = await queryBuilder
      .clone()
      .select("COALESCE(analytics.device->>'type', 'Unknown')", 'device')
      .addSelect('COUNT(DISTINCT analytics.visitorId)', 'visitors')
      .groupBy('device')
      .orderBy('visitors', 'DESC')
      .getRawMany();

    const deviceBreakdown = deviceBreakdownResult.map((result) => ({
      device: result.device,
      visitors: parseInt(result.visitors),
      percentage:
        uniqueVisitors > 0
          ? (parseInt(result.visitors) / uniqueVisitors) * 100
          : 0,
    }));

    // Get time series data (simplified implementation)
    const timeSeriesResult = await queryBuilder
      .clone()
      .select(`DATE_TRUNC('${granularity}', analytics.timestamp)`, 'date')
      .addSelect(
        "COUNT(*) FILTER (WHERE analytics.eventType = 'page_view')",
        'pageViews',
      )
      .addSelect('COUNT(DISTINCT analytics.visitorId)', 'uniqueVisitors')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const timeSeries = timeSeriesResult.map((result) => ({
      date: result.date,
      pageViews: parseInt(result.pageViews),
      uniqueVisitors: parseInt(result.uniqueVisitors),
    }));

    return {
      siteId: id,
      totalPageViews,
      uniqueVisitors,
      avgSessionDuration: 0, // TODO: Calculate based on session events
      bounceRate: 0, // TODO: Calculate bounce rate
      topPages,
      trafficSources,
      deviceBreakdown,
      timeSeries,
    };
  }

  // Bulk Operations
  async bulkSiteOperation(
    bulkOperationDto: BulkSiteOperationDto,
    adminUserId: string,
  ): Promise<{ message: string; processedCount: number }> {
    const { siteIds, operation, reason } = bulkOperationDto;

    const sites = await this.siteRepository.findBy({ id: In(siteIds) });

    if (sites.length !== siteIds.length) {
      throw new BadRequestException('Some sites not found');
    }

    let processedCount = 0;

    for (const site of sites) {
      switch (operation) {
        case 'activate':
          site.isActive = true;
          break;
        case 'deactivate':
          site.isActive = false;
          break;
        case 'archive':
          site.status = SiteStatus.SUSPENDED;
          site.isActive = false;
          break;
        case 'delete':
          // Soft delete
          site.status = SiteStatus.SUSPENDED;
          site.isActive = false;
          break;
      }

      await this.siteRepository.save(site);
      processedCount++;

      // Log each action
      await this.logAdminAction(
        AuditAction.SITE_BULK_OPERATION,
        adminUserId,
        site.customerId,
        'site',
        {
          siteId: site.id,
          domain: site.domain,
          operation,
          reason,
        },
      );
    }

    return {
      message: `Bulk ${operation} completed successfully`,
      processedCount,
    };
  }

  // Helper method for audit logging
  private async logAdminAction(
    action: AuditAction,
    adminUserId: string,
    targetUserId?: string,
    targetResource?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        action,
        adminUserId,
        targetUserId,
        targetResource,
        metadata,
        ipAddress,
        userAgent,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Failed to log admin action', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
}
