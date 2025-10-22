import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';

import { AdminModule } from '../src/admin/admin.module';
import { CustomerModule } from '../src/customer/customer.module';
import { AuthModule } from '../src/auth/auth.module';
import { AiQueueService } from '../src/admin/services/ai-queue.service';
import { WizardSessionService } from '../src/customer/services/wizard-session.service';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../src/admin/entities/ai-request.entity';
import {
  WizardSession,
  WizardSessionStatus,
} from '../src/customer/entities/wizard-session.entity';
import { User } from '../src/auth/entities/user.entity';

describe('AI Queue Content Application (e2e)', () => {
  let app: INestApplication;
  let aiQueueService: AiQueueService;
  let wizardSessionService: WizardSessionService;
  let testUser: User;
  let testWizardSession: WizardSession;
  let testAiRequest: AiRequest;

  const mockGeneratedContent = {
    services: [
      {
        id: 1,
        name: 'Professional Translation Services',
        description: 'High-quality translation services for business documents',
        price: '$0.15/word',
        features: [
          'Certified translators',
          '24/7 support',
          'Quality guarantee',
        ],
      },
      {
        id: 2,
        name: 'Document Localization',
        description: 'Complete localization services for technical documents',
        price: '$0.20/word',
        features: [
          'Cultural adaptation',
          'Technical expertise',
          'Fast turnaround',
        ],
      },
    ],
    hero: {
      title: 'Professional Translation Services',
      subtitle: 'Breaking language barriers for global success',
      cta: 'Get Your Quote Today',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get<string>('DATABASE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('DATABASE_PORT') || '7603',
            ),
            username:
              configService.get<string>('DATABASE_USER') || 'locod_user',
            password:
              configService.get<string>('DATABASE_PASSWORD') ||
              'locod_pass_2024',
            database: configService.get<string>('DATABASE_NAME') || 'locod_db',
            entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false, // Disable logging during tests
          }),
          inject: [ConfigService],
        }),
        AdminModule,
        CustomerModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    aiQueueService = moduleFixture.get<AiQueueService>(AiQueueService);
    wizardSessionService =
      moduleFixture.get<WizardSessionService>(WizardSessionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create a test user for wizard session
    testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      role: 'customer' as any,
    } as User;

    // Create a test wizard session
    const sessionId = 'test-session-' + Date.now();
    testWizardSession = await wizardSessionService.createSession(
      testUser.id,
      sessionId,
      {
        siteName: 'Translation Pro',
        businessType: 'translation',
        currentStep: 3,
        wizardData: {
          basicInfo: {
            siteName: 'Translation Pro',
            businessType: 'translation',
          },
        },
      },
    );

    // Create a test AI request
    testAiRequest = await aiQueueService.createRequest({
      customerId: testUser.id,
      requestType: RequestType.SERVICES,
      businessType: 'translation',
      requestData: {
        siteName: 'Translation Pro',
        businessType: 'translation',
      },
      wizardSessionId: testWizardSession.sessionId,
      priority: RequestPriority.NORMAL,
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      if (testWizardSession) {
        await wizardSessionService.deleteSession(
          testWizardSession.sessionId,
          testUser.id,
        );
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Content Application Integration', () => {
    it('should apply AI generated content to wizard session when completing request', async () => {
      // First, assign and start processing the request (simulate admin workflow)
      const adminId = 'test-admin-' + Date.now();

      // Assign request to admin
      await aiQueueService.assignRequest(testAiRequest.id, adminId);

      // Start processing
      await aiQueueService.startProcessing(testAiRequest.id, adminId);

      // Complete the request with generated content
      const completedRequest = await aiQueueService.completeRequest(
        testAiRequest.id,
        adminId,
        mockGeneratedContent,
        'Generated professional translation services content',
        2.5,
      );

      // Verify the request was completed
      expect(completedRequest.status).toBe(RequestStatus.COMPLETED);
      expect(completedRequest.generatedContent).toEqual(mockGeneratedContent);
      expect(completedRequest.processingNotes).toBe(
        'Generated professional translation services content',
      );
      expect(completedRequest.actualCost).toBe(2.5);

      // Wait a bit for async content application
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the content was applied to the wizard session
      const updatedSession = await wizardSessionService.getSession(
        testWizardSession.sessionId,
        testUser.id,
      );

      expect(updatedSession.wizardData.services).toBeDefined();
      expect(updatedSession.wizardData.services).toHaveLength(2);
      expect(updatedSession.wizardData.services[0].name).toBe(
        'Professional Translation Services',
      );
      expect(updatedSession.wizardData.services[1].name).toBe(
        'Document Localization',
      );

      expect(updatedSession.wizardData.hero).toBeDefined();
      expect(updatedSession.wizardData.hero.title).toBe(
        'Professional Translation Services',
      );
      expect(updatedSession.wizardData.hero.subtitle).toBe(
        'Breaking language barriers for global success',
      );
    });

    it('should handle content application failure gracefully', async () => {
      // Create request with invalid wizard session ID
      const invalidRequest = await aiQueueService.createRequest({
        customerId: testUser.id,
        requestType: RequestType.SERVICES,
        businessType: 'translation',
        requestData: { siteName: 'Test' },
        wizardSessionId: 'non-existent-session-id',
        priority: RequestPriority.NORMAL,
      });

      const adminId = 'test-admin-' + Date.now();

      // Process the request
      await aiQueueService.assignRequest(invalidRequest.id, adminId);
      await aiQueueService.startProcessing(invalidRequest.id, adminId);

      // Complete should not throw error even if content application fails
      const completedRequest = await aiQueueService.completeRequest(
        invalidRequest.id,
        adminId,
        mockGeneratedContent,
        'Test content',
      );

      // Request should still be marked as completed
      expect(completedRequest.status).toBe(RequestStatus.COMPLETED);
      expect(completedRequest.generatedContent).toEqual(mockGeneratedContent);
    });

    it('should skip content application if no wizard session is associated', async () => {
      // Create request without wizard session
      const requestWithoutSession = await aiQueueService.createRequest({
        customerId: testUser.id,
        requestType: RequestType.SERVICES,
        businessType: 'translation',
        requestData: { siteName: 'Test' },
        priority: RequestPriority.NORMAL,
        // No wizardSessionId
      });

      const adminId = 'test-admin-' + Date.now();

      // Process the request
      await aiQueueService.assignRequest(requestWithoutSession.id, adminId);
      await aiQueueService.startProcessing(requestWithoutSession.id, adminId);

      // Complete should work normally
      const completedRequest = await aiQueueService.completeRequest(
        requestWithoutSession.id,
        adminId,
        mockGeneratedContent,
      );

      // Request should be completed successfully
      expect(completedRequest.status).toBe(RequestStatus.COMPLETED);
      expect(completedRequest.generatedContent).toEqual(mockGeneratedContent);
    });

    it('should handle different request types correctly', async () => {
      const heroContent = {
        hero: {
          title: 'Welcome to Translation Pro',
          subtitle: 'Your trusted language partner',
        },
      };

      // Create request for hero content
      const heroRequest = await aiQueueService.createRequest({
        customerId: testUser.id,
        requestType: RequestType.CONTENT,
        businessType: 'translation',
        requestData: { contentType: 'hero' },
        wizardSessionId: testWizardSession.sessionId,
        priority: RequestPriority.NORMAL,
      });

      const adminId = 'test-admin-' + Date.now();

      await aiQueueService.assignRequest(heroRequest.id, adminId);
      await aiQueueService.startProcessing(heroRequest.id, adminId);

      const completed = await aiQueueService.completeRequest(
        heroRequest.id,
        adminId,
        heroContent,
      );

      expect(completed.status).toBe(RequestStatus.COMPLETED);

      // Wait for content application
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify hero content was applied
      const updatedSession = await wizardSessionService.getSession(
        testWizardSession.sessionId,
        testUser.id,
      );

      expect(updatedSession.wizardData.hero).toBeDefined();
      expect(updatedSession.wizardData.hero.title).toBe(
        'Welcome to Translation Pro',
      );
    });
  });

  describe('Content Application Logging', () => {
    it('should log successful content application', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const adminId = 'test-admin-' + Date.now();

      await aiQueueService.assignRequest(testAiRequest.id, adminId);
      await aiQueueService.startProcessing(testAiRequest.id, adminId);

      await aiQueueService.completeRequest(
        testAiRequest.id,
        adminId,
        mockGeneratedContent,
      );

      // Check for success logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '🔧 AI Queue: Applying content to wizard session',
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '✅ Successfully applied AI content from request',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should log content application failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create request with invalid session
      const invalidRequest = await aiQueueService.createRequest({
        customerId: testUser.id,
        requestType: RequestType.SERVICES,
        businessType: 'translation',
        requestData: { siteName: 'Test' },
        wizardSessionId: 'invalid-session',
        priority: RequestPriority.NORMAL,
      });

      const adminId = 'test-admin-' + Date.now();

      await aiQueueService.assignRequest(invalidRequest.id, adminId);
      await aiQueueService.startProcessing(invalidRequest.id, adminId);

      await aiQueueService.completeRequest(
        invalidRequest.id,
        adminId,
        mockGeneratedContent,
      );

      // Check for error logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '❌ Failed to apply AI content to wizard session',
        ),
        expect.any(String),
      );

      consoleSpy.mockRestore();
    });
  });
});
