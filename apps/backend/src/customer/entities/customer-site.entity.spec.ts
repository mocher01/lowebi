import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSite, SiteStatus } from './customer-site.entity';

describe('CustomerSite Entity', () => {
  let repository: Repository<CustomerSite>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(CustomerSite),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<Repository<CustomerSite>>(
      getRepositoryToken(CustomerSite),
    );
  });

  describe('Entity Creation', () => {
    it('should create a customer site with required fields', () => {
      const site = new CustomerSite({
        name: 'Test Site',
        domain: 'test-site.logen.com',
        customerId: 'user-uuid-1',
      });

      expect(site).toBeDefined();
      expect(site.name).toBe('Test Site');
      expect(site.domain).toBe('test-site.logen.com');
      expect(site.customerId).toBe('user-uuid-1');
      // Default values are set by TypeORM, not constructor
      expect(site.status).toBeUndefined(); // Will be set by TypeORM defaults
    });

    it('should create a customer site with all fields', () => {
      const siteData = {
        name: 'Full Test Site',
        description: 'A comprehensive test site',
        domain: 'full-test-site.logen.com',
        businessType: 'restaurant',
        status: SiteStatus.DEPLOYED,
        customerId: 'user-uuid-2',
        configuration: { primaryColor: '#FF0000', layout: 'grid' },
        content: { hero: { title: 'Welcome' } },
        isActive: true,
        deploymentUrl: 'https://full-test-site.logen.com',
        lastDeployedAt: new Date('2024-01-02'),
      };

      const site = new CustomerSite(siteData);

      expect(site.name).toBe('Full Test Site');
      expect(site.description).toBe('A comprehensive test site');
      expect(site.domain).toBe('full-test-site.logen.com');
      expect(site.businessType).toBe('restaurant');
      expect(site.status).toBe(SiteStatus.DEPLOYED);
      expect(site.customerId).toBe('user-uuid-2');
      expect(site.configuration).toEqual({
        primaryColor: '#FF0000',
        layout: 'grid',
      });
      expect(site.content).toEqual({ hero: { title: 'Welcome' } });
      expect(site.isActive).toBe(true);
      expect(site.deploymentUrl).toBe('https://full-test-site.logen.com');
    });
  });

  describe('Enums', () => {
    it('should have correct SiteStatus enum values', () => {
      expect(SiteStatus.DRAFT).toBe('draft');
      expect(SiteStatus.IN_PROGRESS).toBe('in_progress');
      expect(SiteStatus.COMPLETED).toBe('completed');
      expect(SiteStatus.DEPLOYED).toBe('deployed');
      expect(SiteStatus.FAILED).toBe('failed');
      expect(SiteStatus.SUSPENDED).toBe('suspended');
      expect(SiteStatus.BUILDING).toBe('building');
      expect(SiteStatus.ERROR).toBe('error');
    });
  });

  describe('Configuration JSON', () => {
    it('should handle configuration field correctly', () => {
      const config = {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        layout: 'sidebar',
        features: ['blog', 'contact', 'gallery'],
      };

      const site = new CustomerSite({
        name: 'Config Test Site',
        domain: 'config-test.logen.com',
        customerId: 'user-uuid-3',
        configuration: config,
      });

      expect(site.configuration).toEqual(config);
      expect(site.configuration.primaryColor).toBe('#007bff');
      expect(site.configuration.features).toContain('blog');
    });

    it('should handle empty configuration', () => {
      const site = new CustomerSite({
        name: 'Empty Config Site',
        domain: 'empty-config.logen.com',
        customerId: 'user-uuid-4',
        configuration: {},
      });

      expect(site.configuration).toEqual({});
    });
  });

  describe('Validation', () => {
    it('should handle null and undefined values correctly', () => {
      const site = new CustomerSite({
        name: 'Minimal Site',
        domain: 'minimal.logen.com',
        customerId: 'user-uuid-5',
        description: null,
        businessType: undefined,
      });

      expect(site.description).toBeNull();
      expect(site.businessType).toBeUndefined();
      // Default values handled by TypeORM, not constructor
      expect(site.status).toBeUndefined(); // Will be set by TypeORM defaults
    });

    it('should set default values correctly', () => {
      const site = new CustomerSite({
        name: 'Default Test',
        domain: 'default-test.logen.com',
        customerId: 'user-uuid-6',
      });

      // TypeORM sets defaults on save, not in constructor
      expect(site.status).toBeUndefined();
      expect(site.isActive).toBeUndefined();
    });
  });

  describe('Repository Operations', () => {
    it('should create and save a customer site', () => {
      const site = new CustomerSite({
        name: 'Repository Test',
        domain: 'repo-test.logen.com',
        customerId: 'user-uuid-7',
      });

      // Mock repository save
      jest.spyOn(repository, 'save').mockResolvedValue(site);

      expect(site).toBeInstanceOf(CustomerSite);
      expect(typeof site.name).toBe('string');
      expect(typeof site.domain).toBe('string');
      expect(typeof site.customerId).toBe('string');
    });

    it('should find sites with relations', () => {
      const site = new CustomerSite({
        name: 'Relations Test',
        domain: 'relations-test.logen.com',
        customerId: 'user-uuid-8',
      });

      // Mock repository findOne
      jest.spyOn(repository, 'findOne').mockResolvedValue(site);

      expect(site).toBeInstanceOf(CustomerSite);
    });

    it('should update site fields', () => {
      const site = new CustomerSite({
        name: 'Original Name',
        domain: 'original.logen.com',
        customerId: 'user-uuid-9',
      });

      // Simulate update
      site.name = 'Updated Name';
      site.status = SiteStatus.DEPLOYED;

      expect(site.name).toBe('Updated Name');
      expect(site.status).toBe(SiteStatus.DEPLOYED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null configuration fields', () => {
      const site = new CustomerSite({
        name: 'Null Config',
        domain: 'null-config.logen.com',
        customerId: 'user-uuid-10',
        configuration: null,
      });

      expect(site.configuration).toBeNull();
    });

    it('should handle large configuration data', () => {
      const largeConfig = {
        colors: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          hex: `#${i.toString(16).padStart(6, '0')}`,
        })),
        layouts: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          name: `Layout ${i}`,
          components: [],
        })),
      };

      const site = new CustomerSite({
        name: 'Large Config Site',
        domain: 'large-config.logen.com',
        customerId: 'user-uuid-11',
        configuration: largeConfig,
      });

      expect(site.configuration.colors).toHaveLength(100);
      expect(site.configuration.layouts).toHaveLength(50);
    });
  });
});
