import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DomainManagementService } from './domain-management.service';
import { NginxConfigService } from './nginx-config.service';
import {
  SiteDomain,
  DomainType,
  DomainStatus,
} from '../customer/entities/site-domain.entity';
import { WizardSession } from '../customer/entities/wizard-session.entity';

describe('DomainManagementService', () => {
  let service: DomainManagementService;
  let siteDomainRepository: Repository<SiteDomain>;
  let wizardSessionRepository: Repository<WizardSession>;
  let nginxConfigService: NginxConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        DOMAIN_BASE: 'dev.lowebi.com',
        SUBDOMAIN_RATE_LIMIT: 10,
      };
      return config[key];
    }),
  };

  const mockNginxConfigService = {
    generateSubdomainConfig: jest
      .fn()
      .mockResolvedValue('/nginx-configs/test.conf'),
    generateCustomDomainConfig: jest
      .fn()
      .mockResolvedValue('/nginx-configs/custom.conf'),
    removeConfig: jest.fn().mockResolvedValue(undefined),
    reloadNginx: jest.fn().mockResolvedValue(undefined),
  };

  const mockWizardSession = {
    id: 'session-uuid-123',
    sessionId: 'session-123',
    siteName: 'Test Site',
    userId: 'user-123',
  } as WizardSession;

  const mockSiteDomain = {
    id: 'domain-uuid-123',
    wizardSessionId: 'session-uuid-123',
    domain: 'test-site.dev.lowebi.com',
    domainType: DomainType.SUBDOMAIN,
    isTemporary: false,
    status: DomainStatus.ACTIVE,
    containerName: 'test-site-session-u',
    getFullUrl: () => 'https://test-site.dev.lowebi.com',
    toDto: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainManagementService,
        {
          provide: getRepositoryToken(SiteDomain),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WizardSession),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NginxConfigService,
          useValue: mockNginxConfigService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DomainManagementService>(DomainManagementService);
    siteDomainRepository = module.get<Repository<SiteDomain>>(
      getRepositoryToken(SiteDomain),
    );
    wizardSessionRepository = module.get<Repository<WizardSession>>(
      getRepositoryToken(WizardSession),
    );
    nginxConfigService = module.get<NginxConfigService>(NginxConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkSubdomainAvailability', () => {
    it('should return available=true for valid available subdomain', async () => {
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(wizardSessionRepository, 'find')
        .mockResolvedValue([mockWizardSession]);
      jest.spyOn(siteDomainRepository, 'count').mockResolvedValue(5); // Under limit

      const result = await service.checkSubdomainAvailability(
        'my-site',
        'user-123',
      );

      expect(result.available).toBe(true);
      expect(result.suggestions).toBeUndefined();
    });

    it('should return available=false for reserved subdomain with suggestions', async () => {
      const result = await service.checkSubdomainAvailability(
        'admin',
        'user-123',
      );

      expect(result.available).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should return available=false for taken subdomain with suggestions', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);
      jest
        .spyOn(wizardSessionRepository, 'find')
        .mockResolvedValue([mockWizardSession]);
      jest.spyOn(siteDomainRepository, 'count').mockResolvedValue(5);

      const result = await service.checkSubdomainAvailability(
        'my-site',
        'user-123',
      );

      expect(result.available).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('my-site-2');
    });

    it('should throw BadRequestException for too short subdomain', async () => {
      await expect(
        service.checkSubdomainAvailability('ab', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for too long subdomain', async () => {
      const longSubdomain = 'a'.repeat(64);
      await expect(
        service.checkSubdomainAvailability(longSubdomain, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid characters', async () => {
      await expect(
        service.checkSubdomainAvailability('my_site!', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rate limit exceeded', async () => {
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(wizardSessionRepository, 'find')
        .mockResolvedValue([mockWizardSession]);
      jest.spyOn(siteDomainRepository, 'count').mockResolvedValue(10); // At limit

      await expect(
        service.checkSubdomainAvailability('my-site', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSubdomain', () => {
    beforeEach(() => {
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(wizardSessionRepository, 'find')
        .mockResolvedValue([mockWizardSession]);
      jest.spyOn(siteDomainRepository, 'count').mockResolvedValue(5);
      jest
        .spyOn(wizardSessionRepository, 'findOne')
        .mockResolvedValue(mockWizardSession);
      jest
        .spyOn(siteDomainRepository, 'create')
        .mockReturnValue(mockSiteDomain);
      jest
        .spyOn(siteDomainRepository, 'save')
        .mockResolvedValue(mockSiteDomain);
      jest
        .spyOn(wizardSessionRepository, 'save')
        .mockResolvedValue(mockWizardSession);
    });

    it('should create and activate subdomain successfully', async () => {
      const result = await service.createSubdomain(
        'session-123',
        'my-site',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(siteDomainRepository.create).toHaveBeenCalled();
      expect(siteDomainRepository.save).toHaveBeenCalled();
      expect(nginxConfigService.generateSubdomainConfig).toHaveBeenCalled();
      expect(nginxConfigService.reloadNginx).toHaveBeenCalled();
      expect(wizardSessionRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if subdomain not available', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);

      await expect(
        service.createSubdomain('session-123', 'my-site', 'user-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if session not found', async () => {
      jest.spyOn(wizardSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createSubdomain('invalid-session', 'my-site', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set status to FAILED if Nginx config fails', async () => {
      jest
        .spyOn(nginxConfigService, 'generateSubdomainConfig')
        .mockRejectedValue(new Error('Nginx config failed'));

      await expect(
        service.createSubdomain('session-123', 'my-site', 'user-123'),
      ).rejects.toThrow();

      expect(siteDomainRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DomainStatus.FAILED,
          errorMessage: 'Nginx config failed',
        }),
      );
    });
  });

  describe('createCustomDomain', () => {
    beforeEach(() => {
      jest
        .spyOn(wizardSessionRepository, 'find')
        .mockResolvedValue([mockWizardSession]);
      jest.spyOn(siteDomainRepository, 'count').mockResolvedValue(5);
      jest
        .spyOn(wizardSessionRepository, 'findOne')
        .mockResolvedValue(mockWizardSession);
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);

      // Mock create to return the object passed to it (with modifications)
      jest
        .spyOn(siteDomainRepository, 'create')
        .mockImplementation((data: any) => data);

      // Mock save to return the object passed to it
      jest
        .spyOn(siteDomainRepository, 'save')
        .mockImplementation((entity: any) => Promise.resolve(entity));

      jest
        .spyOn(wizardSessionRepository, 'save')
        .mockResolvedValue(mockWizardSession);
      // Reset nginx mock to successful state
      jest
        .spyOn(nginxConfigService, 'generateSubdomainConfig')
        .mockResolvedValue('/nginx-configs/test.conf');
      jest
        .spyOn(nginxConfigService, 'reloadNginx')
        .mockResolvedValue(undefined);
    });

    it('should create custom domain with temp subdomain', async () => {
      const result = await service.createCustomDomain(
        'session-123',
        'mysite.com',
        'user-123',
      );

      expect(result.domain).toBeDefined();
      expect(result.tempDomain).toBeDefined();
      expect(result.verificationToken).toBeDefined();
      expect(result.domain.status).toBe(DomainStatus.PENDING);
    });

    it('should throw BadRequestException for invalid domain format', async () => {
      await expect(
        service.createCustomDomain('session-123', 'invalid', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for domain with protocol', async () => {
      await expect(
        service.createCustomDomain(
          'session-123',
          'https://mysite.com',
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for already registered domain', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);

      await expect(
        service.createCustomDomain('session-123', 'mysite.com', 'user-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should generate verification token with 7-day expiry', async () => {
      const result = await service.createCustomDomain(
        'session-123',
        'mysite.com',
        'user-123',
      );

      expect(result.verificationToken).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex = 64 chars
      expect(result.domain.verificationExpiresAt).toBeDefined();

      const now = new Date();
      const expiryDate = new Date(result.domain.verificationExpiresAt!);
      const daysDiff = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });
  });

  describe('deleteDomain', () => {
    it('should delete domain and remove Nginx config', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);
      jest
        .spyOn(siteDomainRepository, 'remove')
        .mockResolvedValue(mockSiteDomain);

      await service.deleteDomain('domain-uuid-123');

      expect(nginxConfigService.removeConfig).toHaveBeenCalledWith(
        mockSiteDomain.domain,
      );
      expect(nginxConfigService.reloadNginx).toHaveBeenCalled();
      expect(siteDomainRepository.remove).toHaveBeenCalledWith(mockSiteDomain);
    });

    it('should throw BadRequestException if domain not found', async () => {
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteDomain('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should continue deletion even if Nginx cleanup fails', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);
      jest
        .spyOn(nginxConfigService, 'removeConfig')
        .mockRejectedValue(new Error('Nginx removal failed'));
      jest
        .spyOn(siteDomainRepository, 'remove')
        .mockResolvedValue(mockSiteDomain);

      await service.deleteDomain('domain-uuid-123');

      expect(siteDomainRepository.remove).toHaveBeenCalled();
    });
  });

  describe('getDomainsForSession', () => {
    it('should return all domains for a session', async () => {
      jest
        .spyOn(wizardSessionRepository, 'findOne')
        .mockResolvedValue(mockWizardSession);
      jest
        .spyOn(siteDomainRepository, 'find')
        .mockResolvedValue([mockSiteDomain]);

      const result = await service.getDomainsForSession('session-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockSiteDomain);
    });

    it('should throw BadRequestException if session not found', async () => {
      jest.spyOn(wizardSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getDomainsForSession('invalid-session'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDomainById', () => {
    it('should return domain by ID', async () => {
      jest
        .spyOn(siteDomainRepository, 'findOne')
        .mockResolvedValue(mockSiteDomain);

      const result = await service.getDomainById('domain-uuid-123');

      expect(result).toEqual(mockSiteDomain);
    });

    it('should throw BadRequestException if domain not found', async () => {
      jest.spyOn(siteDomainRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getDomainById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateContainerName', () => {
    it('should generate correct container name format', () => {
      const result = service.generateContainerName(
        'My Test Site',
        'session-uuid-123',
      );

      // Format: {slug}-{first-8-chars-of-sessionId}
      expect(result).toBe('my-test-site-session-');
      expect(result).toMatch(/^[a-z0-9-]+$/); // Only lowercase, numbers, hyphens
    });

    it('should sanitize special characters', () => {
      const result = service.generateContainerName('Café René!', 'abc-def-123');

      expect(result).not.toContain('é');
      expect(result).not.toContain('!');
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result).toBe('cafe-rene-abc-def-');
    });

    it('should handle accented characters', () => {
      const result = service.generateContainerName(
        'Résumé École',
        '12345678-abcd',
      );

      expect(result).toContain('resume-ecole');
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result).toBe('resume-ecole-12345678');
    });

    it('should handle very long names', () => {
      const longName = 'a'.repeat(100);
      const result = service.generateContainerName(longName, '12345678-abcd');

      // Slug gets truncated to 63 chars, then shortId appended
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result.length).toBeGreaterThan(0);
      // Should still have the session ID part
      expect(result).toContain('12345678');
    });
  });

  describe('Validation edge cases', () => {
    it('should reject subdomain with consecutive hyphens', async () => {
      await expect(
        service.checkSubdomainAvailability('my--site', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject subdomain that is only numbers', async () => {
      await expect(
        service.checkSubdomainAvailability('123456', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject subdomain starting with hyphen', async () => {
      await expect(
        service.checkSubdomainAvailability('-mysite', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject subdomain ending with hyphen', async () => {
      await expect(
        service.checkSubdomainAvailability('mysite-', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject custom domain without TLD', async () => {
      await expect(
        service.createCustomDomain('session-123', 'mysite', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject custom domain with spaces', async () => {
      await expect(
        service.createCustomDomain('session-123', 'my site.com', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Reserved subdomains', () => {
    const reservedNames = [
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

    reservedNames.forEach((name) => {
      it(`should reject reserved subdomain: ${name}`, async () => {
        const result = await service.checkSubdomainAvailability(
          name,
          'user-123',
        );
        expect(result.available).toBe(false);
        expect(result.suggestions).toBeDefined();
      });
    });
  });
});
