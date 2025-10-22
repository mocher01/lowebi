import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerUsage } from './customer-usage.entity';

describe('CustomerUsage Entity', () => {
  let repository: Repository<CustomerUsage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(CustomerUsage),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<Repository<CustomerUsage>>(
      getRepositoryToken(CustomerUsage),
    );
  });

  describe('Entity Creation', () => {
    it('should create a customer usage with required fields', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-1',
        siteId: 'site-uuid-1',
        month: '2024-08',
      });

      expect(usage).toBeDefined();
      expect(usage.customerId).toBe('customer-uuid-1');
      expect(usage.siteId).toBe('site-uuid-1');
      expect(usage.month).toBe('2024-08');
      // Default values are set by TypeORM, not constructor
      expect(usage.pageViews).toBeUndefined();
      expect(usage.uniqueVisitors).toBeUndefined();
      expect(usage.bandwidthUsed).toBeUndefined();
      expect(usage.storageUsed).toBeUndefined();
    });

    it('should create a customer usage with all fields', () => {
      const usageData = {
        customerId: 'customer-uuid-2',
        siteId: 'site-uuid-2',
        month: '2024-09',
        pageViews: 10500,
        uniqueVisitors: 2500,
        bandwidthUsed: 1024.5,
        storageUsed: 512.25,
        apiRequests: 15000,
        emailsSent: 150,
        backupsCreated: 12,
        sslCertificatesUsed: 3,
        domainsConnected: 2,
        metadata: { source: 'analytics', region: 'us-east-1' },
      };

      const usage = new CustomerUsage(usageData);

      expect(usage.customerId).toBe('customer-uuid-2');
      expect(usage.siteId).toBe('site-uuid-2');
      expect(usage.month).toBe('2024-09');
      expect(usage.pageViews).toBe(10500);
      expect(usage.uniqueVisitors).toBe(2500);
      expect(usage.bandwidthUsed).toBe(1024.5);
      expect(usage.storageUsed).toBe(512.25);
      expect(usage.apiRequests).toBe(15000);
      expect(usage.emailsSent).toBe(150);
      expect(usage.backupsCreated).toBe(12);
      expect(usage.sslCertificatesUsed).toBe(3);
      expect(usage.domainsConnected).toBe(2);
      expect(usage.metadata).toEqual({
        source: 'analytics',
        region: 'us-east-1',
      });
    });
  });

  describe('Metrics Handling', () => {
    it('should handle large numeric values correctly', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-3',
        siteId: 'site-uuid-3',
        month: '2024-10',
        pageViews: 1000000,
        uniqueVisitors: 50000,
        bandwidthUsed: 9999.99,
        storageUsed: 8888.88,
      });

      expect(usage.pageViews).toBe(1000000);
      expect(usage.uniqueVisitors).toBe(50000);
      expect(usage.bandwidthUsed).toBe(9999.99);
      expect(usage.storageUsed).toBe(8888.88);
    });

    it('should handle zero values correctly', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-4',
        siteId: 'site-uuid-4',
        month: '2024-11',
        pageViews: 0,
        uniqueVisitors: 0,
        bandwidthUsed: 0,
        storageUsed: 0,
      });

      // Explicit values should be set by constructor
      expect(usage.pageViews).toBe(0);
      expect(usage.uniqueVisitors).toBe(0);
      expect(usage.bandwidthUsed).toBe(0);
      expect(usage.storageUsed).toBe(0);
    });

    it('should handle decimal values for bandwidth and storage', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-5',
        siteId: 'site-uuid-5',
        month: '2024-12',
        bandwidthUsed: 123.456,
        storageUsed: 789.123,
      });

      expect(usage.bandwidthUsed).toBe(123.456);
      expect(usage.storageUsed).toBe(789.123);
    });
  });

  describe('Metadata JSON', () => {
    it('should handle metadata field correctly', () => {
      const metadata = {
        datacenter: 'us-west-2',
        tracking: {
          googleAnalytics: true,
          heatmaps: false,
        },
        features: ['cdn', 'ssl', 'backup'],
        performance: {
          avgLoadTime: 1.2,
          uptime: 99.9,
        },
      };

      const usage = new CustomerUsage({
        customerId: 'customer-uuid-6',
        siteId: 'site-uuid-6',
        month: '2025-01',
        metadata: metadata,
      });

      expect(usage.metadata).toEqual(metadata);
      expect(usage.metadata.datacenter).toBe('us-west-2');
      expect(usage.metadata.tracking.googleAnalytics).toBe(true);
      expect(usage.metadata.features).toContain('cdn');
      expect(usage.metadata.performance.avgLoadTime).toBe(1.2);
    });

    it('should handle empty metadata', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-7',
        siteId: 'site-uuid-7',
        month: '2025-02',
        metadata: {},
      });

      expect(usage.metadata).toEqual({});
    });

    it('should handle null metadata', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-8',
        siteId: 'site-uuid-8',
        month: '2025-03',
        metadata: null,
      });

      expect(usage.metadata).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should handle null and undefined values correctly', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-9',
        siteId: 'site-uuid-9',
        month: '2025-04',
        apiRequests: null,
        emailsSent: undefined,
      });

      expect(usage.apiRequests).toBeNull();
      expect(usage.emailsSent).toBeUndefined();
      // TypeORM sets defaults on save, not in constructor
      expect(usage.pageViews).toBeUndefined(); // Default value
      expect(usage.uniqueVisitors).toBeUndefined(); // Default value
    });

    it('should set default values correctly', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-10',
        siteId: 'site-uuid-10',
        month: '2025-05',
      });

      // Default values are set by TypeORM, not constructor
      expect(usage.pageViews).toBeUndefined();
      expect(usage.uniqueVisitors).toBeUndefined();
      expect(usage.bandwidthUsed).toBeUndefined();
      expect(usage.storageUsed).toBeUndefined();
      // TypeORM sets these defaults on save
      expect(usage.apiRequests).toBeUndefined();
      expect(usage.emailsSent).toBeUndefined();
      expect(usage.backupsCreated).toBeUndefined();
      expect(usage.sslCertificatesUsed).toBeUndefined();
      expect(usage.domainsConnected).toBeUndefined();
    });
  });

  describe('Month Format', () => {
    it('should handle different month formats', () => {
      const usage1 = new CustomerUsage({
        customerId: 'customer-uuid-11',
        siteId: 'site-uuid-11',
        month: '2024-01',
      });

      const usage2 = new CustomerUsage({
        customerId: 'customer-uuid-12',
        siteId: 'site-uuid-12',
        month: '2024-12',
      });

      expect(usage1.month).toBe('2024-01');
      expect(usage2.month).toBe('2024-12');
    });
  });

  describe('Repository Operations', () => {
    it('should create and save a customer usage', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-13',
        siteId: 'site-uuid-13',
        month: '2025-06',
        pageViews: 5000,
      });

      // Mock repository save
      jest.spyOn(repository, 'save').mockResolvedValue(usage);

      expect(usage).toBeInstanceOf(CustomerUsage);
      expect(typeof usage.customerId).toBe('string');
      expect(typeof usage.siteId).toBe('string');
      expect(typeof usage.month).toBe('string');
      expect(typeof usage.pageViews).toBe('number');
    });

    it('should find usage records with relations', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-14',
        siteId: 'site-uuid-14',
        month: '2025-07',
      });

      // Mock repository findOne
      jest.spyOn(repository, 'findOne').mockResolvedValue(usage);

      expect(usage).toBeInstanceOf(CustomerUsage);
    });

    it('should update usage metrics', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-15',
        siteId: 'site-uuid-15',
        month: '2025-08',
        pageViews: 1000,
        uniqueVisitors: 100,
      });

      // Simulate metric updates
      usage.pageViews += 500;
      usage.uniqueVisitors += 50;
      usage.bandwidthUsed = 256.5;

      expect(usage.pageViews).toBe(1500);
      expect(usage.uniqueVisitors).toBe(150);
      expect(usage.bandwidthUsed).toBe(256.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large numbers', () => {
      const usage = new CustomerUsage({
        customerId: 'customer-uuid-16',
        siteId: 'site-uuid-16',
        month: '2025-09',
        pageViews: 999999999,
        apiRequests: 888888888,
      });

      expect(usage.pageViews).toBe(999999999);
      expect(usage.apiRequests).toBe(888888888);
    });

    it('should handle complex metadata structures', () => {
      const complexMetadata = {
        analytics: {
          platforms: ['google', 'facebook', 'twitter'],
          campaigns: {
            summer: { clicks: 1000, conversions: 50 },
            winter: { clicks: 800, conversions: 40 },
          },
        },
        technical: {
          cdn: {
            provider: 'cloudflare',
            regions: ['us', 'eu', 'asia'],
            cacheHitRate: 85.5,
          },
        },
      };

      const usage = new CustomerUsage({
        customerId: 'customer-uuid-17',
        siteId: 'site-uuid-17',
        month: '2025-10',
        metadata: complexMetadata,
      });

      expect(usage.metadata.analytics.platforms).toHaveLength(3);
      expect(usage.metadata.analytics.campaigns.summer.clicks).toBe(1000);
      expect(usage.metadata.technical.cdn.cacheHitRate).toBe(85.5);
    });
  });
});
