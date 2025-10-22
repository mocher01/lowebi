import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AiQueueController } from './ai-queue.controller';
import { AiQueueService } from '../services/ai-queue.service';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../entities/ai-request.entity';

describe('AiQueueController', () => {
  let controller: AiQueueController;
  let service: AiQueueService;

  const mockAiQueueService = {
    createRequest: jest.fn(),
    getQueue: jest.fn(),
    getRequest: jest.fn(),
    assignRequest: jest.fn(),
    startProcessing: jest.fn(),
    completeRequest: jest.fn(),
    rejectRequest: jest.fn(),
    updateRequest: jest.fn(),
    getQueueStats: jest.fn(),
    getRequestsByAdmin: jest.fn(),
    getOverdueRequests: jest.fn(),
  };

  const mockRequest = {
    user: { id: 1, email: 'admin@test.com' },
  };

  const mockAiRequest: Partial<AiRequest> = {
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
      controllers: [AiQueueController],
      providers: [
        {
          provide: AiQueueService,
          useValue: mockAiQueueService,
        },
      ],
    }).compile();

    controller = module.get<AiQueueController>(AiQueueController);
    service = module.get<AiQueueService>(AiQueueService);

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

      mockAiQueueService.createRequest.mockResolvedValue(mockAiRequest);

      const result = await controller.createRequest(createDto);

      expect(mockAiQueueService.createRequest).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAiRequest);
    });
  });

  describe('getQueue', () => {
    it('should return paginated queue with default parameters', async () => {
      const mockResponse = {
        requests: [mockAiRequest],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockAiQueueService.getQueue.mockResolvedValue(mockResponse);

      const result = await controller.getQueue();

      expect(mockAiQueueService.getQueue).toHaveBeenCalledWith({}, 1, 50);
      expect(result).toEqual(mockResponse);
    });

    it('should return queue with filters and pagination', async () => {
      const mockResponse = {
        requests: [mockAiRequest],
        total: 1,
        page: 2,
        totalPages: 5,
      };

      mockAiQueueService.getQueue.mockResolvedValue(mockResponse);

      const result = await controller.getQueue(
        RequestStatus.PENDING,
        RequestType.SERVICES,
        1,
        'translation',
        RequestPriority.HIGH,
        '2025-01-01',
        '2025-12-31',
        2,
        10,
      );

      expect(mockAiQueueService.getQueue).toHaveBeenCalledWith(
        {
          status: RequestStatus.PENDING,
          requestType: RequestType.SERVICES,
          adminId: 1,
          businessType: 'translation',
          priority: RequestPriority.HIGH,
          fromDate: new Date('2025-01-01'),
          toDate: new Date('2025-12-31'),
        },
        2,
        10,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        assigned: 2,
        processing: 1,
        completed: 3,
        rejected: 1,
        averageProcessingTime: 150,
        totalRevenue: 25.5,
      };

      mockAiQueueService.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(mockAiQueueService.getQueueStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('getOverdueRequests', () => {
    it('should return overdue requests', async () => {
      mockAiQueueService.getOverdueRequests.mockResolvedValue([mockAiRequest]);

      const result = await controller.getOverdueRequests();

      expect(mockAiQueueService.getOverdueRequests).toHaveBeenCalled();
      expect(result).toEqual([mockAiRequest]);
    });
  });

  describe('getRequestsByAdmin', () => {
    it('should return requests by admin ID', async () => {
      mockAiQueueService.getRequestsByAdmin.mockResolvedValue([mockAiRequest]);

      const result = await controller.getRequestsByAdmin(1);

      expect(mockAiQueueService.getRequestsByAdmin).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockAiRequest]);
    });
  });

  describe('getRequest', () => {
    it('should return specific AI request', async () => {
      mockAiQueueService.getRequest.mockResolvedValue(mockAiRequest);

      const result = await controller.getRequest(1);

      expect(mockAiQueueService.getRequest).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAiRequest);
    });
  });

  describe('assignRequest', () => {
    it('should assign request to current admin', async () => {
      const assignedRequest = {
        ...mockAiRequest,
        status: RequestStatus.ASSIGNED,
        adminId: 1,
      };
      mockAiQueueService.assignRequest.mockResolvedValue(assignedRequest);

      const result = await controller.assignRequest(1, mockRequest);

      expect(mockAiQueueService.assignRequest).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(assignedRequest);
    });
  });

  describe('startProcessing', () => {
    it('should start processing request', async () => {
      const processingRequest = {
        ...mockAiRequest,
        status: RequestStatus.PROCESSING,
      };
      mockAiQueueService.startProcessing.mockResolvedValue(processingRequest);

      const result = await controller.startProcessing(1, mockRequest);

      expect(mockAiQueueService.startProcessing).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(processingRequest);
    });
  });

  describe('completeRequest', () => {
    it('should complete request with generated content', async () => {
      const body = {
        generatedContent: { result: 'test content' },
        processingNotes: 'Processing completed',
        actualCost: 2.5,
      };

      const completedRequest = {
        ...mockAiRequest,
        status: RequestStatus.COMPLETED,
      };
      mockAiQueueService.completeRequest.mockResolvedValue(completedRequest);

      const result = await controller.completeRequest(1, body, mockRequest);

      expect(mockAiQueueService.completeRequest).toHaveBeenCalledWith(
        1,
        1,
        body.generatedContent,
        body.processingNotes,
        body.actualCost,
      );
      expect(result).toEqual(completedRequest);
    });

    it('should throw BadRequestException if generated content is missing', async () => {
      const body = { processingNotes: 'test' };

      await expect(
        controller.completeRequest(1, body, mockRequest),
      ).rejects.toThrow(BadRequestException);

      expect(mockAiQueueService.completeRequest).not.toHaveBeenCalled();
    });
  });

  describe('rejectRequest', () => {
    it('should reject request with reason', async () => {
      const body = { reason: 'Invalid requirements' };
      const rejectedRequest = {
        ...mockAiRequest,
        status: RequestStatus.REJECTED,
      };
      mockAiQueueService.rejectRequest.mockResolvedValue(rejectedRequest);

      const result = await controller.rejectRequest(1, body, mockRequest);

      expect(mockAiQueueService.rejectRequest).toHaveBeenCalledWith(
        1,
        1,
        'Invalid requirements',
      );
      expect(result).toEqual(rejectedRequest);
    });

    it('should throw BadRequestException if reason is missing', async () => {
      const body = {};

      await expect(
        controller.rejectRequest(1, body, mockRequest),
      ).rejects.toThrow(BadRequestException);

      expect(mockAiQueueService.rejectRequest).not.toHaveBeenCalled();
    });
  });

  describe('updateRequest', () => {
    it('should update request', async () => {
      const updateDto = { processingNotes: 'Updated notes' };
      const updatedRequest = {
        ...mockAiRequest,
        processingNotes: 'Updated notes',
      };
      mockAiQueueService.updateRequest.mockResolvedValue(updatedRequest);

      const result = await controller.updateRequest(1, updateDto);

      expect(mockAiQueueService.updateRequest).toHaveBeenCalledWith(
        1,
        updateDto,
      );
      expect(result).toEqual(updatedRequest);
    });
  });

  describe('deleteRequest', () => {
    it('should soft delete request by marking as cancelled', async () => {
      const cancelledRequest = {
        ...mockAiRequest,
        status: RequestStatus.CANCELLED,
      };
      mockAiQueueService.updateRequest.mockResolvedValue(cancelledRequest);

      const result = await controller.deleteRequest(1);

      expect(mockAiQueueService.updateRequest).toHaveBeenCalledWith(1, {
        status: RequestStatus.CANCELLED,
      });
      expect(result).toEqual({ message: 'Request 1 cancelled successfully' });
    });
  });
});
