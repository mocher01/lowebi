import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('getHealth', () => {
    it('should return basic health information', () => {
      const result = controller.getHealth();

      expect(result).toEqual(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number),
          }),
          pid: expect.any(Number),
        }),
      );
    });

    it('should return current timestamp in ISO format', () => {
      const result = controller.getHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeCloseTo(Date.now(), -3); // Within 1000ms
    });

    it('should return process uptime', () => {
      const result = controller.getHealth();

      expect(result.uptime).toBeGreaterThan(0);
      expect(typeof result.uptime).toBe('number');
    });

    it('should return memory usage information', () => {
      const result = controller.getHealth();

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');
      expect(typeof result.memory.rss).toBe('number');
    });

    it('should return process ID', () => {
      const result = controller.getHealth();

      expect(result.pid).toBe(process.pid);
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', () => {
      const result = controller.getDetailedHealth();

      expect(result).toEqual(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
          system: expect.objectContaining({
            uptime: expect.any(Number),
            platform: expect.any(String),
            arch: expect.any(String),
            nodeVersion: expect.any(String),
            pid: expect.any(Number),
            cpuUsage: expect.objectContaining({
              user: expect.any(Number),
              system: expect.any(Number),
            }),
            loadAverage: expect.any(Array),
          }),
          memory: expect.objectContaining({
            rss: expect.stringMatching(/\d+ MB/),
            heapTotal: expect.stringMatching(/\d+ MB/),
            heapUsed: expect.stringMatching(/\d+ MB/),
            external: expect.stringMatching(/\d+ MB/),
          }),
        }),
      );
    });

    it('should return system information', () => {
      const result = controller.getDetailedHealth();

      expect(result.system.platform).toBe(process.platform);
      expect(result.system.arch).toBe(process.arch);
      expect(result.system.nodeVersion).toBe(process.version);
      expect(result.system.pid).toBe(process.pid);
    });

    it('should return CPU usage information', () => {
      const result = controller.getDetailedHealth();

      expect(result.system.cpuUsage).toHaveProperty('user');
      expect(result.system.cpuUsage).toHaveProperty('system');
      expect(typeof result.system.cpuUsage.user).toBe('number');
      expect(typeof result.system.cpuUsage.system).toBe('number');
    });

    it('should return load average (or zeros on Windows)', () => {
      const result = controller.getDetailedHealth();

      expect(Array.isArray(result.system.loadAverage)).toBe(true);
      expect(result.system.loadAverage).toHaveLength(3);
      result.system.loadAverage.forEach((load) => {
        expect(typeof load).toBe('number');
        expect(load).toBeGreaterThanOrEqual(0);
      });
    });

    it('should format memory usage as MB strings', () => {
      const result = controller.getDetailedHealth();

      expect(result.memory.rss).toMatch(/^\d+ MB$/);
      expect(result.memory.heapTotal).toMatch(/^\d+ MB$/);
      expect(result.memory.heapUsed).toMatch(/^\d+ MB$/);
      expect(result.memory.external).toMatch(/^\d+ MB$/);
    });

    it('should return environment information', () => {
      const result = controller.getDetailedHealth();

      expect(typeof result.environment).toBe('string');
      expect(typeof result.version).toBe('string');
    });
  });
});
