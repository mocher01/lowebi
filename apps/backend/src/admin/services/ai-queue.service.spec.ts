import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AiQueueService } from './ai-queue.service';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../entities/ai-request.entity';
import { WizardSessionService } from '../../customer/services/wizard-session.service';

describe('AiQueueService', () => {
  let service: AiQueueService;
  let repository: Repository<AiRequest>;
  let wizardSessionService: WizardSessionService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWizardSessionService = {
    applyAiContent: jest.fn(),
  };

  const mockAiRequest = {
    id: 1,
    customerId: 1,
    siteId: 'test-site',
    requestType: RequestType.SERVICES,
    businessType: 'translation',
    status: RequestStatus.PENDING,
    priority: RequestPriority.NORMAL,
    requestData: { siteName: 'Test Site' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiQueueService,
        {
          provide: getRepositoryToken(AiRequest),
          useValue: mockRepository,
        },
        {
          provide: WizardSessionService,
          useValue: mockWizardSessionService,
        },
      ],
    }).compile();

    service = module.get<AiQueueService>(AiQueueService);
    repository = module.get<Repository<AiRequest>>(
      getRepositoryToken(AiRequest),
    );
    wizardSessionService =
      module.get<WizardSessionService>(WizardSessionService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create a new AI request', async () => {
      const createDto = {
        customerId: 1,
        siteId: 'test-site',
        requestType: RequestType.SERVICES,
        businessType: 'translation',
        requestData: { siteName: 'Test Site' },
      };

      mockRepository.create.mockReturnValue(mockAiRequest);
      mockRepository.save.mockResolvedValue(mockAiRequest);

      const result = await service.createRequest(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: RequestStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockAiRequest);
      expect(result).toEqual(mockAiRequest);
    });
  });

  describe('getQueue', () => {
    it('should return paginated AI requests with filters', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockAiRequest], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters = { status: RequestStatus.PENDING };
      const result = await service.getQueue(filters, 1, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('request');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'request.status = :status',
        { status: RequestStatus.PENDING },
      );
      expect(result).toEqual({
        requests: [mockAiRequest],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should apply multiple filters correctly', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters = {
        status: RequestStatus.PENDING,
        requestType: RequestType.SERVICES,
        adminId: 1,
        businessType: 'translation',
        priority: RequestPriority.HIGH,
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-12-31'),
      };

      await service.getQueue(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(7);
    });
  });

  describe('getRequest', () => {
    it('should return AI request by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockAiRequest);

      const result = await service.getRequest(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockAiRequest);
    });

    it('should throw NotFoundException when request not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getRequest(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('assignRequest', () => {
    it('should assign request to admin', async () => {
      const pendingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PENDING,
      };
      const assignedRequest = {
        ...pendingRequest,
        status: RequestStatus.ASSIGNED,
        adminId: 1,
        assignedAt: expect.any(Date),
      };

      mockRepository.findOne.mockResolvedValue(pendingRequest);
      mockRepository.save.mockResolvedValue(assignedRequest);

      const result = await service.assignRequest(1, 1);

      expect(result.status).toBe(RequestStatus.ASSIGNED);
      expect(result.adminId).toBe(1);
      expect(result.assignedAt).toBeDefined();
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const assignedRequest = {
        ...mockAiRequest,
        status: RequestStatus.ASSIGNED,
      };
      mockRepository.findOne.mockResolvedValue(assignedRequest);

      await expect(service.assignRequest(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startProcessing', () => {
    it('should start processing assigned request', async () => {
      const assignedRequest = {
        ...mockAiRequest,
        status: RequestStatus.ASSIGNED,
        adminId: 1,
      };

      mockRepository.findOne.mockResolvedValue(assignedRequest);
      mockRepository.save.mockResolvedValue({
        ...assignedRequest,
        status: RequestStatus.PROCESSING,
        startedAt: expect.any(Date),
      });

      const result = await service.startProcessing(1, 1);

      expect(result.status).toBe(RequestStatus.PROCESSING);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw BadRequestException if request is not assigned to admin', async () => {
      const assignedRequest = {
        ...mockAiRequest,
        status: RequestStatus.ASSIGNED,
        adminId: 2,
      };
      mockRepository.findOne.mockResolvedValue(assignedRequest);

      await expect(service.startProcessing(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeRequest', () => {
    it('should complete processing request', async () => {
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
        adminId: 1,
        startedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(processingRequest);
      mockRepository.save.mockResolvedValue({
        ...processingRequest,
        status: RequestStatus.COMPLETED,
        generatedContent: { result: 'test content' },
        completedAt: expect.any(Date),
      });

      const result = await service.completeRequest(1, 1, {
        result: 'test content',
      });

      expect(result.status).toBe(RequestStatus.COMPLETED);
      expect(result.generatedContent).toEqual({ result: 'test content' });
      expect(result.completedAt).toBeDefined();
    });

    it('should calculate processing duration', async () => {
      const startedAt = new Date('2025-01-01T10:00:00Z');
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
        adminId: 1,
        startedAt,
      };

      mockRepository.findOne.mockResolvedValue(processingRequest);

      const completedRequest = {
        ...processingRequest,
        status: RequestStatus.COMPLETED,
        processingDuration: 3600, // 1 hour in seconds
        completedAt: new Date('2025-01-01T11:00:00Z'),
      };

      mockRepository.save.mockResolvedValue(completedRequest);

      const result = await service.completeRequest(1, 1, { result: 'test' });

      expect(result.processingDuration).toBeDefined();
    });

    it('should apply content to wizard session when completing request with wizardSessionId', async () => {
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
        adminId: 1,
        wizardSessionId: 'test-session-123',
        requestType: 'services',
      };

      const generatedContent = {
        services: [{ name: 'Test Service', description: 'Test description' }],
      };

      mockRepository.findOne.mockResolvedValue(processingRequest);
      mockRepository.save.mockResolvedValue({
        ...processingRequest,
        status: RequestStatus.COMPLETED,
        generatedContent,
      });
      mockWizardSessionService.applyAiContent.mockResolvedValue({
        id: 'session-123',
      });

      await service.completeRequest(1, 1, generatedContent);

      expect(mockWizardSessionService.applyAiContent).toHaveBeenCalledWith(
        'test-session-123',
        'services',
        generatedContent,
      );
    });

    it('should not fail completion if content application fails', async () => {
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
        adminId: 1,
        wizardSessionId: 'test-session-123',
      };

      const generatedContent = { services: [] };

      mockRepository.findOne.mockResolvedValue(processingRequest);
      mockRepository.save.mockResolvedValue({
        ...processingRequest,
        status: RequestStatus.COMPLETED,
        generatedContent,
      });
      mockWizardSessionService.applyAiContent.mockRejectedValue(
        new Error('Wizard session not found'),
      );

      // Should not throw despite content application failure
      const result = await service.completeRequest(1, 1, generatedContent);

      expect(result.status).toBe(RequestStatus.COMPLETED);
      expect(mockWizardSessionService.applyAiContent).toHaveBeenCalled();
    });

    it('should skip content application if no wizardSessionId', async () => {
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
        adminId: 1,
        wizardSessionId: null, // No wizard session
      };

      mockRepository.findOne.mockResolvedValue(processingRequest);
      mockRepository.save.mockResolvedValue({
        ...processingRequest,
        status: RequestStatus.COMPLETED,
      });

      await service.completeRequest(1, 1, { content: 'test' });

      expect(mockWizardSessionService.applyAiContent).not.toHaveBeenCalled();
    });
  });

  describe('rejectRequest', () => {
    it('should reject request with reason', async () => {
      const assignedRequest = { ...mockAiRequest, adminId: 1 };

      mockRepository.findOne.mockResolvedValue(assignedRequest);
      mockRepository.save.mockResolvedValue({
        ...assignedRequest,
        status: RequestStatus.REJECTED,
        errorMessage: 'Invalid requirements',
        completedAt: expect.any(Date),
      });

      const result = await service.rejectRequest(1, 1, 'Invalid requirements');

      expect(result.status).toBe(RequestStatus.REJECTED);
      expect(result.errorMessage).toBe('Invalid requirements');
      expect(result.completedAt).toBeDefined();
    });

    it('should throw BadRequestException if admin not assigned', async () => {
      const assignedRequest = { ...mockAiRequest, adminId: 2 };
      mockRepository.findOne.mockResolvedValue(assignedRequest);

      await expect(service.rejectRequest(1, 1, 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateRequest', () => {
    it('should update request fields', async () => {
      mockRepository.findOne.mockResolvedValue(mockAiRequest);
      mockRepository.save.mockResolvedValue({
        ...mockAiRequest,
        processingNotes: 'Updated notes',
        updatedAt: expect.any(Date),
      });

      const result = await service.updateRequest(1, {
        processingNotes: 'Updated notes',
      });

      expect(result.processingNotes).toBe('Updated notes');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('getQueueStats', () => {
    it('should return comprehensive queue statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(2) // assigned
        .mockResolvedValueOnce(1) // processing
        .mockResolvedValueOnce(3) // completed
        .mockResolvedValueOnce(1); // rejected

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock average processing time
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ avg: '150' }) // average processing time
        .mockResolvedValueOnce({ total: '25.50' }); // total revenue

      const result = await service.getQueueStats();

      expect(result).toEqual({
        total: 10,
        pending: 3,
        assigned: 2,
        processing: 1,
        completed: 3,
        rejected: 1,
        averageProcessingTime: 150,
        totalRevenue: 25.5,
      });
    });
  });

  describe('getRequestsByAdmin', () => {
    it('should return requests assigned to specific admin', async () => {
      mockRepository.find.mockResolvedValue([mockAiRequest]);

      const result = await service.getRequestsByAdmin(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { adminId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockAiRequest]);
    });
  });

  describe('getOverdueRequests', () => {
    it('should return pending requests older than 24 hours', async () => {
      mockRepository.find.mockResolvedValue([mockAiRequest]);

      const result = await service.getOverdueRequests();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          status: RequestStatus.PENDING,
          createdAt: expect.any(Date),
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual([mockAiRequest]);
    });
  });
});
