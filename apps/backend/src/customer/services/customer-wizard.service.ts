import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WebsiteWizardSession,
  WizardStatus,
  WizardStep,
} from '../entities/website-wizard-session.entity';
import { CustomerSubscription } from '../entities/customer-subscription.entity';
import { CustomerSite, SiteStatus } from '../entities/customer-site.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';
import {
  StartWizardDto,
  UpdateWizardSessionDto,
  CompleteWizardDto,
  WizardSessionResponseDto,
  BusinessInfoDto,
  TemplateSelectionDto,
  DesignPreferencesDto,
} from '../dto/customer-wizard.dto';
import { CustomerSitesService } from './customer-sites.service';

@Injectable()
export class CustomerWizardService {
  constructor(
    @InjectRepository(WebsiteWizardSession)
    private readonly wizardSessionRepository: Repository<WebsiteWizardSession>,
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(CustomerSite)
    private readonly siteRepository: Repository<CustomerSite>,
    @InjectRepository(CustomerUsage)
    private readonly usageRepository: Repository<CustomerUsage>,
    private readonly customerSitesService: CustomerSitesService,
  ) {}

  async startWizard(
    customerId: string,
    startDto: StartWizardDto,
  ): Promise<WizardSessionResponseDto> {
    // Check subscription limits
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    // Check if user has reached site limit
    const currentSiteCount = await this.siteRepository.count({
      where: { customerId, isActive: true },
    });

    if (currentSiteCount >= subscription.sitesLimit) {
      throw new ForbiddenException('Site limit reached for current plan');
    }

    // Create wizard session
    const session = this.wizardSessionRepository.create({
      customerId,
      sessionName: startDto.sessionName || `Website Project ${Date.now()}`,
      status: WizardStatus.IN_PROGRESS,
      currentStep: WizardStep.BUSINESS_INFO,
      completedSteps: [],
      progressPercentage: 0,
      businessInfo: startDto.businessInfo || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastActivityAt: new Date(),
      estimatedCompletionTime: 30, // 30 minutes
    });

    const savedSession = await this.wizardSessionRepository.save(session);
    return this.transformSessionToResponse(savedSession);
  }

  async getWizardSession(
    customerId: string,
    sessionId: string,
  ): Promise<WizardSessionResponseDto> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    if (session.isExpired) {
      session.status = WizardStatus.EXPIRED;
      await this.wizardSessionRepository.save(session);
    }

    return this.transformSessionToResponse(session);
  }

  async updateWizardSession(
    customerId: string,
    sessionId: string,
    updateDto: UpdateWizardSessionDto,
  ): Promise<WizardSessionResponseDto> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    if (session.isExpired) {
      throw new BadRequestException('Wizard session has expired');
    }

    // Update session data
    Object.assign(session, updateDto);
    session.lastActivityAt = new Date();

    // Update progress based on completed steps
    if (updateDto.completedSteps) {
      session.completedSteps = updateDto.completedSteps;
      this.updateProgress(session);
    }

    const updatedSession = await this.wizardSessionRepository.save(session);
    return this.transformSessionToResponse(updatedSession);
  }

  async completeWizard(
    customerId: string,
    sessionId: string,
    completeDto: CompleteWizardDto,
  ): Promise<{ siteId: string; message: string; deploymentUrl?: string }> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    if (session.isExpired) {
      throw new BadRequestException('Wizard session has expired');
    }

    // Validate that all required steps are completed
    const requiredSteps = [
      WizardStep.BUSINESS_INFO,
      WizardStep.TEMPLATE_SELECTION,
      WizardStep.DESIGN_PREFERENCES,
      WizardStep.CONTENT_CREATION,
    ];

    const missingSteps = requiredSteps.filter(
      (step) => !session.completedSteps.includes(step),
    );
    if (missingSteps.length > 0) {
      throw new BadRequestException(
        `Missing required steps: ${missingSteps.join(', ')}`,
      );
    }

    // Create the website
    const siteData = this.buildSiteFromWizard(session, completeDto);
    const site = await this.customerSitesService.createSite(
      customerId,
      siteData,
    );

    // Update session
    session.status = WizardStatus.COMPLETED;
    session.generatedSiteId = site.id;
    session.deploymentConfig = {
      domain: completeDto.subdomain || site.domain,
      deployImmediately: completeDto.deployImmediately,
      completedAt: new Date(),
    };

    await this.wizardSessionRepository.save(session);

    // Deploy if requested
    if (completeDto.deployImmediately) {
      await this.customerSitesService.deploySite(customerId, site.id, {});
    }

    return {
      siteId: site.id,
      message: 'Website created successfully',
      deploymentUrl: completeDto.deployImmediately
        ? site.deploymentUrl || `https://${site.domain}`
        : undefined,
    };
  }

  async listWizardSessions(
    customerId: string,
  ): Promise<WizardSessionResponseDto[]> {
    const sessions = await this.wizardSessionRepository.find({
      where: { customerId },
      order: { updatedAt: 'DESC' },
    });

    return sessions.map((session) => this.transformSessionToResponse(session));
  }

  async saveBusinessInfo(
    customerId: string,
    sessionId: string,
    businessInfoDto: BusinessInfoDto,
  ): Promise<WizardSessionResponseDto> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    session.businessInfo = businessInfoDto;
    session.lastActivityAt = new Date();
    session.markStepCompleted(WizardStep.BUSINESS_INFO);

    const updatedSession = await this.wizardSessionRepository.save(session);
    return this.transformSessionToResponse(updatedSession);
  }

  async saveTemplateSelection(
    customerId: string,
    sessionId: string,
    templateSelectionDto: TemplateSelectionDto,
  ): Promise<WizardSessionResponseDto> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    session.templateSelection = templateSelectionDto;
    session.lastActivityAt = new Date();
    session.markStepCompleted(WizardStep.TEMPLATE_SELECTION);

    const updatedSession = await this.wizardSessionRepository.save(session);
    return this.transformSessionToResponse(updatedSession);
  }

  async saveDesignPreferences(
    customerId: string,
    sessionId: string,
    designPreferencesDto: DesignPreferencesDto,
  ): Promise<WizardSessionResponseDto> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    session.designPreferences = designPreferencesDto;
    session.lastActivityAt = new Date();
    session.markStepCompleted(WizardStep.DESIGN_PREFERENCES);

    const updatedSession = await this.wizardSessionRepository.save(session);
    return this.transformSessionToResponse(updatedSession);
  }

  async generateAIContent(
    customerId: string,
    sessionId: string,
  ): Promise<{ message: string; estimatedTime: number }> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    if (!session.businessInfo || !session.templateSelection) {
      throw new BadRequestException(
        'Business information and template selection required for content generation',
      );
    }

    // Check AI generation limits
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    const currentPeriod = new Date().toISOString().slice(0, 7);
    const aiUsage = await this.getUsageByType(
      customerId,
      UsageType.AI_GENERATION,
      currentPeriod,
    );

    if (
      subscription &&
      subscription.aiGenerationLimit !== -1 &&
      aiUsage >= subscription.aiGenerationLimit
    ) {
      throw new ForbiddenException(
        'AI generation limit reached for current plan',
      );
    }

    // Start AI content generation
    session.aiGenerationRequests = {
      status: 'in_progress',
      startedAt: new Date(),
      businessInfo: session.businessInfo,
      templateId: session.templateSelection.templateId,
    };

    await this.wizardSessionRepository.save(session);

    // Track usage
    await this.trackUsage(customerId, UsageType.AI_GENERATION, 1);

    // Start async content generation process
    this.processAIContentGeneration(session);

    return {
      message: 'AI content generation started',
      estimatedTime: 5, // 5 minutes
    };
  }

  async getContentGenerationStatus(
    customerId: string,
    sessionId: string,
  ): Promise<{ status: string; progress: number; content?: any }> {
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, customerId },
    });

    if (!session) {
      throw new NotFoundException('Wizard session not found');
    }

    const aiRequests = session.aiGenerationRequests;
    if (!aiRequests) {
      return { status: 'not_started', progress: 0 };
    }

    return {
      status: aiRequests.status || 'unknown',
      progress: aiRequests.progress || 0,
      content:
        aiRequests.status === 'completed' ? session.contentData : undefined,
    };
  }

  private transformSessionToResponse(
    session: WebsiteWizardSession,
  ): WizardSessionResponseDto {
    return {
      id: session.id,
      sessionName: session.sessionName,
      status: session.status,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      progressPercentage: session.progressPercentage,
      businessInfo: session.businessInfo,
      templateSelection: session.templateSelection,
      designPreferences: session.designPreferences,
      contentData: session.contentData,
      aiGenerationRequests: session.aiGenerationRequests,
      customizationSettings: session.customizationSettings,
      finalConfiguration: session.finalConfiguration,
      generatedSiteId: session.generatedSiteId,
      deploymentConfig: session.deploymentConfig,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      estimatedCompletionTime: session.estimatedCompletionTime,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private updateProgress(session: WebsiteWizardSession): void {
    const totalSteps = Object.keys(WizardStep).length;
    session.progressPercentage = Math.round(
      (session.completedSteps.length / totalSteps) * 100,
    );
  }

  private buildSiteFromWizard(
    session: WebsiteWizardSession,
    completeDto: CompleteWizardDto,
  ): any {
    return {
      name:
        completeDto.siteName ||
        session.businessInfo?.businessName ||
        'My Website',
      description:
        session.businessInfo?.description || 'Generated with LOGEN AI',
      domain:
        completeDto.subdomain ||
        `site-${Date.now()}${Math.random().toString(36).substr(2, 5)}.logen.com`,
      configuration: {
        ...session.designPreferences,
        ...session.customizationSettings,
        businessInfo: session.businessInfo,
      },
      content: session.contentData,
    };
  }

  private async processAIContentGeneration(
    session: WebsiteWizardSession,
  ): Promise<void> {
    // AI content generation is now handled via public endpoints and frontend polling
    console.log('AI content generation delegated to public API endpoints');
  }

  private generateMockContent(businessInfo: any): any {
    const businessName = businessInfo?.businessName || 'Your Business';
    const industry = businessInfo?.industry || 'business';
    const description = businessInfo?.description || 'A great business';

    return {
      hero: {
        title: `Welcome to ${businessName}`,
        subtitle: `Your trusted partner in ${industry}`,
        description: description,
        ctaText: 'Get Started',
      },
      about: {
        title: `About ${businessName}`,
        content: `${businessName} is a leading company in the ${industry} industry. ${description}`,
      },
      services: businessInfo?.services?.map(
        (service: string, index: number) => ({
          id: index + 1,
          title: service,
          description: `Professional ${service.toLowerCase()} services tailored to your needs.`,
          icon: 'service-icon',
        }),
      ) || [
        {
          id: 1,
          title: 'Professional Services',
          description: 'High-quality services tailored to your needs.',
          icon: 'service-icon',
        },
      ],
      contact: {
        title: 'Contact Us',
        email: businessInfo?.contactEmail || 'info@business.com',
        phone: businessInfo?.contactPhone || '+1 (555) 123-4567',
        address: businessInfo?.address || '123 Business St, City, State',
      },
    };
  }

  private async getUsageByType(
    customerId: string,
    type: UsageType,
    period: string,
  ): Promise<number> {
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.type = :type', { type })
      .andWhere('usage.billingPeriod = :period', { period })
      .getRawOne();

    return parseFloat(result.total) || 0;
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
      unit: 'count',
      billingPeriod,
      siteId,
    });

    await this.usageRepository.save(usage);
  }
}
