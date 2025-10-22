import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus, CustomerTier } from './customer.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

describe('Customer Entity', () => {
  let customerRepository: Repository<Customer>;
  let userRepository: Repository<User>;
  let module: TestingModule;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [],
  } as User;

  const mockCustomer = {
    id: 'customer-123',
    userId: 'user-123',
    companyName: 'Test Company',
    businessType: 'Technology',
    phoneNumber: '+1234567890',
    address: '123 Test St, Test City, TC 12345',
    websiteUrl: 'https://testcompany.com',
    status: CustomerStatus.ACTIVE,
    tier: CustomerTier.FREE,
    billingInfo: {
      stripeCustomerId: 'cus_test123',
    },
    preferences: {
      aiContentPreferences: {
        tone: 'professional',
        style: 'business',
      },
    },
    metadata: {
      source: 'website',
      utm_campaign: 'test-campaign',
    },
    sitesCount: 2,
    aiRequestsCount: 5,
    totalSpent: 99.99,
    lastActivityAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  } as Customer;

  beforeEach(async () => {
    const mockCustomerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
      })),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    customerRepository = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Entity Creation', () => {
    it('should create a customer with required fields', () => {
      const customer = new Customer({
        userId: 'user-123',
        companyName: 'Test Company',
        businessType: 'Technology',
      });

      expect(customer.userId).toBe('user-123');
      expect(customer.companyName).toBe('Test Company');
      expect(customer.businessType).toBe('Technology');
      expect(customer.status).toBe(CustomerStatus.ACTIVE);
      expect(customer.tier).toBe(CustomerTier.FREE);
      expect(customer.preferences).toEqual({});
      expect(customer.metadata).toEqual({});
      expect(customer.sitesCount).toBe(0);
      expect(customer.aiRequestsCount).toBe(0);
      expect(customer.totalSpent).toBe(0);
      expect(customer.isActive).toBe(true);
    });

    it('should create a customer with all optional fields', () => {
      const customer = new Customer(mockCustomer);

      expect(customer.id).toBe('customer-123');
      expect(customer.userId).toBe('user-123');
      expect(customer.companyName).toBe('Test Company');
      expect(customer.businessType).toBe('Technology');
      expect(customer.phoneNumber).toBe('+1234567890');
      expect(customer.address).toBe('123 Test St, Test City, TC 12345');
      expect(customer.websiteUrl).toBe('https://testcompany.com');
      expect(customer.status).toBe(CustomerStatus.ACTIVE);
      expect(customer.tier).toBe(CustomerTier.FREE);
      expect(customer.billingInfo).toEqual({
        stripeCustomerId: 'cus_test123',
      });
      expect(customer.preferences).toEqual({
        aiContentPreferences: {
          tone: 'professional',
          style: 'business',
        },
      });
      expect(customer.metadata).toEqual({
        source: 'website',
        utm_campaign: 'test-campaign',
      });
      expect(customer.sitesCount).toBe(2);
      expect(customer.aiRequestsCount).toBe(5);
      expect(customer.totalSpent).toBe(99.99);
      expect(customer.isActive).toBe(true);
    });
  });

  describe('Enums', () => {
    it('should have correct CustomerStatus enum values', () => {
      expect(CustomerStatus.ACTIVE).toBe('active');
      expect(CustomerStatus.INACTIVE).toBe('inactive');
      expect(CustomerStatus.SUSPENDED).toBe('suspended');
      expect(CustomerStatus.PENDING_VERIFICATION).toBe('pending_verification');
    });

    it('should have correct CustomerTier enum values', () => {
      expect(CustomerTier.FREE).toBe('free');
      expect(CustomerTier.BASIC).toBe('basic');
      expect(CustomerTier.PREMIUM).toBe('premium');
      expect(CustomerTier.ENTERPRISE).toBe('enterprise');
    });
  });

  describe('JSONB Fields', () => {
    it('should handle billingInfo JSONB field correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
        billingInfo: {
          stripeCustomerId: 'cus_test123',
          subscriptionId: 'sub_test123',
          paymentMethodId: 'pm_test123',
          billingAddress: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TC',
            postal_code: '12345',
            country: 'US',
          },
        },
      });

      expect(customer.billingInfo).toBeDefined();
      expect(customer.billingInfo?.stripeCustomerId).toBe('cus_test123');
      expect(customer.billingInfo?.subscriptionId).toBe('sub_test123');
      expect(customer.billingInfo?.paymentMethodId).toBe('pm_test123');
      expect(customer.billingInfo?.billingAddress).toBeDefined();
    });

    it('should handle preferences JSONB field correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
        preferences: {
          aiContentPreferences: {
            tone: 'professional',
            style: 'business',
            terminology: ['enterprise', 'solution', 'innovation'],
          },
          notificationSettings: {
            email: true,
            sms: false,
          },
          customField: 'custom value',
        },
      });

      expect(customer.preferences).toBeDefined();
      expect(customer.preferences.aiContentPreferences?.tone).toBe(
        'professional',
      );
      expect(customer.preferences.aiContentPreferences?.terminology).toEqual([
        'enterprise',
        'solution',
        'innovation',
      ]);
      expect(customer.preferences.notificationSettings?.email).toBe(true);
      expect(customer.preferences.notificationSettings?.sms).toBe(false);
      expect(customer.preferences.customField).toBe('custom value');
    });

    it('should handle metadata JSONB field correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
        metadata: {
          source: 'google_ads',
          utm_campaign: 'summer_promotion',
          utm_medium: 'cpc',
          utm_source: 'google',
          referrer: 'https://google.com',
          customData: {
            nested: 'value',
            array: [1, 2, 3],
          },
        },
      });

      expect(customer.metadata).toBeDefined();
      expect(customer.metadata.source).toBe('google_ads');
      expect(customer.metadata.utm_campaign).toBe('summer_promotion');
      expect(customer.metadata.customData).toEqual({
        nested: 'value',
        array: [1, 2, 3],
      });
    });
  });

  describe('Validation', () => {
    it('should handle null and undefined values correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
        companyName: null,
        phoneNumber: undefined,
      });

      expect(customer.userId).toBe('user-123');
      expect(customer.companyName).toBeNull();
      expect(customer.phoneNumber).toBeUndefined();
    });

    it('should set default values correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
      });

      expect(customer.status).toBe(CustomerStatus.ACTIVE);
      expect(customer.tier).toBe(CustomerTier.FREE);
      expect(customer.preferences).toEqual({});
      expect(customer.metadata).toEqual({});
      expect(customer.sitesCount).toBe(0);
      expect(customer.aiRequestsCount).toBe(0);
      expect(customer.totalSpent).toBe(0);
      expect(customer.isActive).toBe(true);
    });
  });

  describe('Repository Operations', () => {
    it('should create and save a customer', async () => {
      const customerData = {
        userId: 'user-123',
        companyName: 'Test Company',
        businessType: 'Technology',
      };

      const customer = new Customer(customerData);

      jest.spyOn(customerRepository, 'create').mockReturnValue(customer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(customer);

      const createdCustomer = customerRepository.create(customerData);
      const savedCustomer = await customerRepository.save(createdCustomer);

      expect(customerRepository.create).toHaveBeenCalledWith(customerData);
      expect(customerRepository.save).toHaveBeenCalledWith(customer);
      expect(savedCustomer).toEqual(customer);
    });

    it('should find customers with relations', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCustomer]),
      };

      jest
        .spyOn(customerRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const customers = await queryBuilder
        .leftJoinAndSelect('customer.user', 'user')
        .where('customer.status = :status', { status: CustomerStatus.ACTIVE })
        .getMany();

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'customer.user',
        'user',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'customer.status = :status',
        {
          status: CustomerStatus.ACTIVE,
        },
      );
      expect(customers).toEqual([mockCustomer]);
    });

    it('should update customer fields', async () => {
      const updateData = {
        status: CustomerStatus.SUSPENDED,
        tier: CustomerTier.PREMIUM,
      };

      jest.spyOn(customerRepository, 'update').mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });

      const result = await customerRepository.update(
        'customer-123',
        updateData,
      );

      expect(customerRepository.update).toHaveBeenCalledWith(
        'customer-123',
        updateData,
      );
      expect(result.affected).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty JSONB fields', () => {
      const customer = new Customer({
        userId: 'user-123',
        billingInfo: {},
        preferences: {},
        metadata: {},
      });

      expect(customer.billingInfo).toEqual({});
      expect(customer.preferences).toEqual({});
      expect(customer.metadata).toEqual({});
    });

    it('should handle large JSONB data', () => {
      const largeMetadata = {
        ...Array.from({ length: 100 }, (_, i) => ({
          [`field${i}`]: `value${i}`,
        })).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
      };

      const customer = new Customer({
        userId: 'user-123',
        metadata: largeMetadata,
      });

      expect(Object.keys(customer.metadata)).toHaveLength(100);
      expect(customer.metadata.field0).toBe('value0');
      expect(customer.metadata.field99).toBe('value99');
    });
  });
});
