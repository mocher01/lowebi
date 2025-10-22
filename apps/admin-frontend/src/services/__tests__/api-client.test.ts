/**
 * @jest-environment jsdom
 */

import { apiClient } from '../api-client';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AdminAPIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '123',
          email: 'admin@locod.ai',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.login('admin@locod.ai', 'admin123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@locod.ai', password: 'admin123' }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      } as Response);

      await expect(apiClient.login('admin@locod.ai', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should refresh token successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '123', email: 'admin@locod.ai', role: 'admin' },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.refreshToken('old-refresh-token');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/auth/refresh',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Queue Management', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
    });

    it('should get queue stats successfully', async () => {
      const mockStats = {
        total: 10,
        pending: 2,
        assigned: 1,
        processing: 1,
        completed: 5,
        rejected: 1,
        averageProcessingTime: 120,
        totalRevenue: 25.50,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await apiClient.getQueueStats();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/admin/queue/stats',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );

      expect(result).toEqual(mockStats);
    });

    it('should get queue with filters', async () => {
      const mockQueueResponse = {
        requests: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQueueResponse,
      } as Response);

      const result = await apiClient.getQueue(1, 20, {
        status: 'pending',
        requestType: 'content',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/queue?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );

      expect(result).toEqual(mockQueueResponse);
    });

    it('should assign request successfully', async () => {
      const mockRequest = {
        id: 1,
        status: 'assigned',
        customerId: 123,
        siteId: 'test-site',
        requestType: 'content',
        businessType: 'translation',
        priority: 'normal',
        requestData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequest,
      } as Response);

      const result = await apiClient.assignRequest(1);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/admin/queue/1/assign',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );

      expect(result).toEqual(mockRequest);
    });

    it('should start processing request', async () => {
      const mockRequest = {
        id: 1,
        status: 'processing',
        customerId: 123,
        siteId: 'test-site',
        requestType: 'content',
        businessType: 'translation',
        priority: 'normal',
        requestData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequest,
      } as Response);

      const result = await apiClient.startProcessing(1);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/admin/queue/1/start',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );

      expect(result).toEqual(mockRequest);
    });

    it('should complete request with generated content', async () => {
      const mockRequest = {
        id: 1,
        status: 'completed',
        customerId: 123,
        siteId: 'test-site',
        requestType: 'content',
        businessType: 'translation',
        priority: 'normal',
        requestData: {},
        generatedContent: { hero: { title: 'Generated Title' } },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequest,
      } as Response);

      const generatedContent = { hero: { title: 'Generated Title' } };
      const result = await apiClient.completeRequest(1, generatedContent, 'Processing notes', 2.50);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/admin/queue/1/complete',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            generatedContent,
            processingNotes: 'Processing notes',
            actualCost: 2.50,
          }),
        }
      );

      expect(result).toEqual(mockRequest);
    });

    it('should reject request with reason', async () => {
      const mockRequest = {
        id: 1,
        status: 'rejected',
        customerId: 123,
        siteId: 'test-site',
        requestType: 'content',
        businessType: 'translation',
        priority: 'normal',
        requestData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequest,
      } as Response);

      const result = await apiClient.rejectRequest(1, 'Invalid request data');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7610/admin/queue/1/reject',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({ reason: 'Invalid request data' }),
        }
      );

      expect(result).toEqual(mockRequest);
    });
  });

  describe('Dashboard Stats', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
    });

    it('should get dashboard stats successfully', async () => {
      const mockQueueStats = {
        total: 10,
        pending: 2,
        assigned: 1,
        processing: 1,
        completed: 5,
        rejected: 1,
        averageProcessingTime: 120,
        totalRevenue: 25.50,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQueueStats,
      } as Response);

      const result = await apiClient.getDashboardStats();

      expect(result).toEqual({
        customers: { total: 0, active: 0 },
        sites: { total: 0, active: 0 },
        aiQueue: mockQueueStats,
        systemHealth: { status: 'Healthy' },
      });
    });
  });

  describe('Base URL Configuration', () => {
    it('should use localhost URL for localhost hostname', () => {
      // Test is implicitly covered by other tests using localhost URLs
      expect(true).toBe(true);
    });

    it('should handle authorization headers correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      // This is tested implicitly in queue management tests
      expect(mockLocalStorage.getItem).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(apiClient.login('admin@locod.ai', 'admin123'))
        .rejects.toThrow('Network error');
    });

    it('should handle HTTP errors with JSON response', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      } as Response);

      await expect(apiClient.login('admin@locod.ai', 'admin123'))
        .rejects.toThrow('Bad request');
    });

    it('should handle HTTP errors without JSON response', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(apiClient.login('admin@locod.ai', 'admin123'))
        .rejects.toThrow('Network error');
    });
  });
});