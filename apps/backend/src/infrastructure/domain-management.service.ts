import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  SiteDomain,
  DomainType,
  DomainStatus,
} from '../customer/entities/site-domain.entity';
import { WizardSession } from '../customer/entities/wizard-session.entity';
import { NginxConfigService } from './nginx-config.service';
import * as crypto from 'crypto';

const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'www',
  'mail',
  'smtp',
  'ftp',
  'ssh',
  'webmail',
  'cpanel',
  'localhost',
  'blog',
  'shop',
  'store',
  'app',
  'dev',
  'staging',
  'test',
  'demo',
  'docs',
  'help',
  'support',
  'status',
];

@Injectable()
export class DomainManagementService {
  private readonly logger = new Logger(DomainManagementService.name);
  private readonly domainBase: string;
  private readonly subdomainRateLimit: number;

  constructor(
    @InjectRepository(SiteDomain)
    private siteDomainRepository: Repository<SiteDomain>,
    @InjectRepository(WizardSession)
    private wizardSessionRepository: Repository<WizardSession>,
    private nginxConfigService: NginxConfigService,
    private configService: ConfigService,
  ) {
    this.domainBase =
      this.configService.get<string>('DOMAIN_BASE') || 'logen.locod-ai.com';
    this.subdomainRateLimit =
      this.configService.get<number>('SUBDOMAIN_RATE_LIMIT') || 10;
  }

  /**
   * Check subdomain availability
   */
  async checkSubdomainAvailability(
    subdomain: string,
    userId: string,
  ): Promise<{ available: boolean; suggestions?: string[] }> {
    this.logger.log(`Checking availability for subdomain: ${subdomain}`);

    // Validate format
    const validationError = this.validateSubdomainFormat(subdomain);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    // Check if reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return {
        available: false,
        suggestions: this.generateSubdomainSuggestions(subdomain),
      };
    }

    // Check if already taken
    const fullDomain = `${subdomain}.${this.domainBase}`;
    const existing = await this.siteDomainRepository.findOne({
      where: { domain: fullDomain },
    });

    if (existing) {
      return {
        available: false,
        suggestions: this.generateSubdomainSuggestions(subdomain),
      };
    }

    // Check user's subdomain rate limit
    const userSubdomainCount = await this.getUserSubdomainCount(userId);
    if (userSubdomainCount >= this.subdomainRateLimit) {
      throw new BadRequestException(
        `Subdomain rate limit reached (${this.subdomainRateLimit} per user)`,
      );
    }

    return { available: true };
  }

  /**
   * Create subdomain (instant activation)
   */
  async createSubdomain(
    sessionId: string,
    subdomain: string,
    userId: string,
  ): Promise<SiteDomain> {
    this.logger.log(
      `Creating subdomain: ${subdomain} for session: ${sessionId}`,
    );

    // Validate availability
    const availabilityCheck = await this.checkSubdomainAvailability(
      subdomain,
      userId,
    );
    if (!availabilityCheck.available) {
      throw new ConflictException(
        `Subdomain ${subdomain} is not available. Try: ${availabilityCheck.suggestions?.join(', ')}`,
      );
    }

    // Get wizard session
    const session = await this.wizardSessionRepository.findOne({
      where: { sessionId },
    });
    if (!session) {
      throw new BadRequestException(`Wizard session not found: ${sessionId}`);
    }

    const fullDomain = `${subdomain}.${this.domainBase}`;
    const containerName = this.generateContainerName(
      session.siteName,
      session.sessionId,
    );

    // Create domain record
    const siteDomain = this.siteDomainRepository.create({
      wizardSessionId: session.id,
      domain: fullDomain,
      domainType: DomainType.SUBDOMAIN,
      isTemporary: false,
      status: DomainStatus.PENDING,
      containerName,
    });

    await this.siteDomainRepository.save(siteDomain);
    this.logger.log(`✅ Domain record created: ${fullDomain}`);

    // Generate Nginx config
    try {
      const configPath = await this.nginxConfigService.generateSubdomainConfig(
        fullDomain,
        containerName,
      );
      siteDomain.nginxConfigPath = configPath;

      // Reload Nginx
      await this.nginxConfigService.reloadNginx();

      // Mark as active
      siteDomain.status = DomainStatus.ACTIVE;
      siteDomain.activatedAt = new Date();

      await this.siteDomainRepository.save(siteDomain);

      // Update wizard session active_domain_id
      session.activeDomainId = siteDomain.id;
      await this.wizardSessionRepository.save(session);

      this.logger.log(`✅ Subdomain activated: ${fullDomain}`);
    } catch (error) {
      this.logger.error(`Failed to activate subdomain: ${error.message}`);
      siteDomain.status = DomainStatus.FAILED;
      siteDomain.errorMessage = error.message;
      await this.siteDomainRepository.save(siteDomain);
      throw error;
    }

    return siteDomain;
  }

  /**
   * Create custom domain (pending verification)
   */
  async createCustomDomain(
    sessionId: string,
    domain: string,
    userId: string,
  ): Promise<{
    domain: SiteDomain;
    tempDomain: SiteDomain;
    verificationToken: string;
  }> {
    this.logger.log(
      `Creating custom domain: ${domain} for session: ${sessionId}`,
    );

    // Validate format
    const validationError = this.validateCustomDomainFormat(domain);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    // Get wizard session
    const session = await this.wizardSessionRepository.findOne({
      where: { sessionId },
    });
    if (!session) {
      throw new BadRequestException(`Wizard session not found: ${sessionId}`);
    }

    // Check if domain already exists
    const existing = await this.siteDomainRepository.findOne({
      where: { domain },
    });
    if (existing) {
      throw new ConflictException(`Domain ${domain} is already registered`);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setDate(verificationExpiresAt.getDate() + 7); // 7 days

    // Create custom domain record (pending)
    const customDomain = this.siteDomainRepository.create({
      wizardSessionId: session.id,
      domain,
      domainType: DomainType.CUSTOM,
      isTemporary: false,
      status: DomainStatus.PENDING,
      verificationToken,
      verificationMethod: 'txt',
      verificationExpiresAt,
    });

    await this.siteDomainRepository.save(customDomain);
    this.logger.log(`✅ Custom domain record created: ${domain} (pending)`);

    // Create temporary subdomain for immediate access
    const tempSubdomain = await this.createTemporarySubdomain(session, userId);

    return {
      domain: customDomain,
      tempDomain: tempSubdomain,
      verificationToken,
    };
  }

  /**
   * Create temporary subdomain during custom domain verification
   */
  private async createTemporarySubdomain(
    session: WizardSession,
    userId: string,
  ): Promise<SiteDomain> {
    const sanitizedName = this.sanitizeSubdomain(session.siteName);
    const shortSessionId = session.id.slice(0, 8);
    const tempSubdomain = `${sanitizedName}-temp-${shortSessionId}`;
    const fullDomain = `${tempSubdomain}.${this.domainBase}`;

    this.logger.log(`Creating temporary subdomain: ${fullDomain}`);

    const containerName = this.generateContainerName(
      session.siteName,
      session.sessionId,
    );

    const siteDomain = this.siteDomainRepository.create({
      wizardSessionId: session.id,
      domain: fullDomain,
      domainType: DomainType.SUBDOMAIN,
      isTemporary: true,
      status: DomainStatus.PENDING,
      containerName,
    });

    await this.siteDomainRepository.save(siteDomain);

    // Generate Nginx config and activate
    try {
      const configPath = await this.nginxConfigService.generateSubdomainConfig(
        fullDomain,
        containerName,
      );
      siteDomain.nginxConfigPath = configPath;

      await this.nginxConfigService.reloadNginx();

      siteDomain.status = DomainStatus.ACTIVE;
      siteDomain.activatedAt = new Date();
      await this.siteDomainRepository.save(siteDomain);

      // Update wizard session active_domain_id
      session.activeDomainId = siteDomain.id;
      await this.wizardSessionRepository.save(session);

      this.logger.log(`✅ Temporary subdomain activated: ${fullDomain}`);
    } catch (error) {
      this.logger.error(
        `Failed to activate temporary subdomain: ${error.message}`,
      );
      siteDomain.status = DomainStatus.FAILED;
      siteDomain.errorMessage = error.message;
      await this.siteDomainRepository.save(siteDomain);
      throw error;
    }

    return siteDomain;
  }

  /**
   * Delete domain
   */
  async deleteDomain(domainId: string): Promise<void> {
    const domain = await this.siteDomainRepository.findOne({
      where: { id: domainId },
    });

    if (!domain) {
      throw new BadRequestException(`Domain not found: ${domainId}`);
    }

    this.logger.log(`Deleting domain: ${domain.domain}`);

    // Remove Nginx config
    try {
      await this.nginxConfigService.removeConfig(domain.domain);
      await this.nginxConfigService.reloadNginx();
    } catch (error) {
      this.logger.error(`Failed to remove Nginx config: ${error.message}`);
    }

    // Delete domain record
    await this.siteDomainRepository.remove(domain);
    this.logger.log(`✅ Domain deleted: ${domain.domain}`);
  }

  /**
   * Get domains for a session
   */
  async getDomainsForSession(sessionId: string): Promise<SiteDomain[]> {
    const session = await this.wizardSessionRepository.findOne({
      where: { sessionId },
    });

    if (!session) {
      throw new BadRequestException(`Wizard session not found: ${sessionId}`);
    }

    return this.siteDomainRepository.find({
      where: { wizardSessionId: session.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get domain by ID
   */
  async getDomainById(domainId: string): Promise<SiteDomain> {
    const domain = await this.siteDomainRepository.findOne({
      where: { id: domainId },
    });

    if (!domain) {
      throw new BadRequestException(`Domain not found: ${domainId}`);
    }

    return domain;
  }

  /**
   * Generate container name
   */
  generateContainerName(siteName: string, sessionId: string): string {
    const slug = this.sanitizeSubdomain(siteName);
    const shortId = sessionId.slice(0, 8);
    return `${slug}-${shortId}`;
  }

  /**
   * Validate subdomain format
   */
  private validateSubdomainFormat(subdomain: string): string | null {
    // Length check
    if (subdomain.length < 3 || subdomain.length > 63) {
      return 'Subdomain must be between 3 and 63 characters';
    }

    // Format check
    const validFormat = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!validFormat.test(subdomain)) {
      return 'Subdomain must contain only lowercase letters, numbers, and hyphens. Must start and end with alphanumeric character';
    }

    // No consecutive hyphens
    if (subdomain.includes('--')) {
      return 'Subdomain cannot contain consecutive hyphens';
    }

    // Not only numbers
    if (/^\d+$/.test(subdomain)) {
      return 'Subdomain cannot be only numbers';
    }

    return null;
  }

  /**
   * Validate custom domain format
   */
  private validateCustomDomainFormat(domain: string): string | null {
    // Check for protocol - domains should not include http:// or https://
    if (/^https?:\/\//i.test(domain)) {
      return 'Domain should not include protocol (http:// or https://)';
    }

    // RFC domain format
    const validFormat =
      /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;
    if (!validFormat.test(domain)) {
      return 'Invalid domain format. Example: example.com or subdomain.example.com';
    }

    // Must have TLD
    if (!domain.includes('.')) {
      return 'Domain must have a top-level domain (e.g., .com, .fr)';
    }

    // No spaces
    if (domain.includes(' ')) {
      return 'Domain cannot contain spaces';
    }

    return null;
  }

  /**
   * Sanitize subdomain (convert to valid format)
   */
  private sanitizeSubdomain(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
      .replace(/--+/g, '-') // Replace consecutive hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 63); // Limit length
  }

  /**
   * Generate subdomain suggestions
   */
  private generateSubdomainSuggestions(subdomain: string): string[] {
    const suggestions: string[] = [];
    const currentYear = new Date().getFullYear();

    suggestions.push(`${subdomain}-${currentYear}`);
    suggestions.push(`${subdomain}-2`);
    suggestions.push(`${subdomain}-app`);

    return suggestions;
  }

  /**
   * Get user's subdomain count
   */
  private async getUserSubdomainCount(userId: string): Promise<number> {
    const sessions = await this.wizardSessionRepository.find({
      where: { userId },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) return 0;

    return this.siteDomainRepository.count({
      where: {
        wizardSessionId: In(sessionIds),
        domainType: DomainType.SUBDOMAIN,
        isTemporary: false,
      },
    });
  }
}
