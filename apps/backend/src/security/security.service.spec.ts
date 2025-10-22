import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityService],
    }).compile();

    service = module.get<SecurityService>(SecurityService);

    // Mock the logger to avoid console output during tests
    loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log security event with basic parameters', () => {
      service.logSecurityEvent('TEST_EVENT', '192.168.1.1');

      expect(loggerSpy).toHaveBeenCalledWith('Security Event: TEST_EVENT', {
        ip: '192.168.1.1',
        userId: undefined,
        timestamp: expect.any(String),
        details: undefined,
      });
    });

    it('should log security event with all parameters', () => {
      const details = { reason: 'Multiple failed attempts' };
      service.logSecurityEvent(
        'FAILED_LOGIN',
        '192.168.1.1',
        'user-123',
        details,
      );

      expect(loggerSpy).toHaveBeenCalledWith('Security Event: FAILED_LOGIN', {
        ip: '192.168.1.1',
        userId: 'user-123',
        timestamp: expect.any(String),
        details,
      });
    });

    it('should include ISO timestamp', () => {
      service.logSecurityEvent('TEST_EVENT', '192.168.1.1');

      const callArgs = loggerSpy.mock.calls[0][1];
      const timestamp = new Date(callArgs.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeCloseTo(Date.now(), -3); // Within 1000ms
    });
  });

  describe('isSuspiciousIP', () => {
    it('should return false for non-suspicious IP', () => {
      const result = service.isSuspiciousIP('192.168.1.1');
      expect(result).toBe(false);
    });

    it('should return true for suspicious IP after adding', () => {
      service.addSuspiciousIP('192.168.1.1', 'Test reason');
      const result = service.isSuspiciousIP('192.168.1.1');
      expect(result).toBe(true);
    });

    it('should return false for different IP', () => {
      service.addSuspiciousIP('192.168.1.1', 'Test reason');
      const result = service.isSuspiciousIP('192.168.1.2');
      expect(result).toBe(false);
    });
  });

  describe('addSuspiciousIP', () => {
    it('should add IP to suspicious list', () => {
      service.addSuspiciousIP('192.168.1.1', 'Multiple failed attempts');

      expect(service.isSuspiciousIP('192.168.1.1')).toBe(true);
    });

    it('should log the addition event', () => {
      service.addSuspiciousIP('192.168.1.1', 'Multiple failed attempts');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Security Event: IP_MARKED_SUSPICIOUS',
        {
          ip: '192.168.1.1',
          userId: undefined,
          timestamp: expect.any(String),
          details: { reason: 'Multiple failed attempts' },
        },
      );
    });

    it('should handle adding same IP multiple times', () => {
      service.addSuspiciousIP('192.168.1.1', 'First reason');
      service.addSuspiciousIP('192.168.1.1', 'Second reason');

      expect(service.isSuspiciousIP('192.168.1.1')).toBe(true);
      expect(loggerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeSuspiciousIP', () => {
    it('should remove IP from suspicious list', () => {
      service.addSuspiciousIP('192.168.1.1', 'Test reason');
      expect(service.isSuspiciousIP('192.168.1.1')).toBe(true);

      service.removeSuspiciousIP('192.168.1.1');
      expect(service.isSuspiciousIP('192.168.1.1')).toBe(false);
    });

    it('should log the removal event', () => {
      service.addSuspiciousIP('192.168.1.1', 'Test reason');
      loggerSpy.mockClear(); // Clear previous calls

      service.removeSuspiciousIP('192.168.1.1');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Security Event: IP_UNMARKED_SUSPICIOUS',
        {
          ip: '192.168.1.1',
          userId: undefined,
          timestamp: expect.any(String),
          details: undefined,
        },
      );
    });

    it('should handle removing non-existent IP gracefully', () => {
      service.removeSuspiciousIP('192.168.1.1');

      expect(service.isSuspiciousIP('192.168.1.1')).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Security Event: IP_UNMARKED_SUSPICIOUS',
        expect.any(Object),
      );
    });
  });

  describe('trackRateLimitAttempt', () => {
    it('should track first attempt for IP', () => {
      const count = service.trackRateLimitAttempt('192.168.1.1');
      expect(count).toBe(1);
    });

    it('should increment attempts for same IP', () => {
      const count1 = service.trackRateLimitAttempt('192.168.1.1');
      const count2 = service.trackRateLimitAttempt('192.168.1.1');
      const count3 = service.trackRateLimitAttempt('192.168.1.1');

      expect(count1).toBe(1);
      expect(count2).toBe(2);
      expect(count3).toBe(3);
    });

    it('should track different IPs separately', () => {
      const count1 = service.trackRateLimitAttempt('192.168.1.1');
      const count2 = service.trackRateLimitAttempt('192.168.1.2');
      const count3 = service.trackRateLimitAttempt('192.168.1.1');

      expect(count1).toBe(1);
      expect(count2).toBe(1);
      expect(count3).toBe(2);
    });
  });

  describe('getSecurityStatus', () => {
    it('should return security status overview', () => {
      service.addSuspiciousIP('192.168.1.1', 'Test');
      service.trackRateLimitAttempt('192.168.1.2');

      const status = service.getSecurityStatus();

      expect(status).toEqual(
        expect.objectContaining({
          suspiciousIPs: expect.any(Number),
          rateLimitAttempts: expect.any(Number),
          totalRateLimitHits: expect.any(Number),
        }),
      );
      expect(status.suspiciousIPs).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = service.validatePasswordStrength('StrongP@ssw0rd123');

      expect(result).toEqual({
        isValid: true,
        score: expect.any(Number),
        feedback: [],
      });
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it('should reject weak password', () => {
      const result = service.validatePasswordStrength('weak');

      expect(result).toEqual({
        isValid: false,
        score: expect.any(Number),
        feedback: expect.arrayContaining([expect.any(String)]),
      });
      expect(result.score).toBeLessThan(4);
    });

    it('should provide feedback for password improvement', () => {
      const result = service.validatePasswordStrength('password123');

      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(
        result.feedback.some(
          (f) => f.includes('uppercase') || f.includes('special'),
        ),
      ).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up when rate limit attempts exceed threshold', () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      // Simulate exceeding threshold by mocking the internal state
      const rateLimitMap = (service as any).rateLimitAttempts;
      for (let i = 0; i < 1001; i++) {
        rateLimitMap.set(`ip-${i}`, 1);
      }

      service.cleanup();

      expect(loggerSpy).toHaveBeenCalledWith('Cleaned up rate limit tracking');
      loggerSpy.mockRestore();
    });

    it('should not clean up when under threshold', () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      service.cleanup();

      expect(loggerSpy).not.toHaveBeenCalledWith(
        'Cleaned up rate limit tracking',
      );
      loggerSpy.mockRestore();
    });
  });
});
