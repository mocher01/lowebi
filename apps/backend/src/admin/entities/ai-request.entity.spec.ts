import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from './ai-request.entity';

describe('AiRequest Entity', () => {
  let aiRequest: AiRequest;

  beforeEach(() => {
    aiRequest = new AiRequest({
      customerId: 1,
      siteId: 'test-site',
      requestType: RequestType.SERVICES,
      businessType: 'translation',
      requestData: { siteName: 'Test Site' },
      createdAt: new Date('2025-01-01T10:00:00Z'),
    });
  });

  describe('constructor', () => {
    it('should create instance with default values', () => {
      const request = new AiRequest({});

      expect(request.status).toBe(RequestStatus.PENDING);
      expect(request.priority).toBe(RequestPriority.NORMAL);
      expect(request.estimatedCost).toBe(0);
      expect(request.revisionCount).toBe(0);
      expect(request.retryCount).toBe(0);
    });
  });

  describe('isExpired getter', () => {
    it('should return false when expiresAt is null', () => {
      aiRequest.expiresAt = null;
      expect(aiRequest.isExpired).toBe(false);
    });

    it('should return true when expiresAt is in the past', () => {
      aiRequest.expiresAt = new Date(Date.now() - 60000);
      expect(aiRequest.isExpired).toBe(true);
    });
  });

  describe('totalDuration getter', () => {
    it('should return null when startedAt is null', () => {
      aiRequest.startedAt = null;
      aiRequest.completedAt = new Date();
      expect(aiRequest.totalDuration).toBeNull();
    });

    it('should calculate duration in seconds', () => {
      aiRequest.startedAt = new Date('2025-01-01T10:00:00Z');
      aiRequest.completedAt = new Date('2025-01-01T10:05:30Z');

      expect(aiRequest.totalDuration).toBe(330);
    });
  });

  describe('isOverdue getter', () => {
    it('should return false for completed requests', () => {
      aiRequest.status = RequestStatus.COMPLETED;
      aiRequest.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      expect(aiRequest.isOverdue).toBe(false);
    });

    it('should return true for old pending requests', () => {
      aiRequest.status = RequestStatus.PENDING;
      aiRequest.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      expect(aiRequest.isOverdue).toBe(true);
    });
  });
});
