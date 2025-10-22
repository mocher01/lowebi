import { Test, TestingModule } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Mock the bootstrap function and its dependencies
jest.mock('@nestjs/core');
jest.mock('@nestjs/swagger');
jest.mock('helmet');

describe('Main Bootstrap Function', () => {
  let mockApp: any;
  let mockListen: jest.Mock;
  let mockUse: jest.Mock;
  let mockEnableCors: jest.Mock;
  let mockUseGlobalPipes: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods to avoid output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create mock app object
    mockListen = jest.fn().mockResolvedValue(undefined);
    mockUse = jest.fn();
    mockEnableCors = jest.fn();
    mockUseGlobalPipes = jest.fn();

    mockApp = {
      listen: mockListen,
      use: mockUse,
      enableCors: mockEnableCors,
      useGlobalPipes: mockUseGlobalPipes,
    };

    // Mock NestFactory.create
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    // Mock helmet
    (helmet as jest.Mock).mockReturnValue('helmet-middleware');

    // Mock SwaggerModule
    (SwaggerModule.createDocument as jest.Mock).mockReturnValue(
      'swagger-document',
    );
    (SwaggerModule.setup as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    jest.restoreAllMocks();

    // Clean up environment variables
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.HTTPS_ENABLED;
  });

  describe('Application Bootstrap', () => {
    it('should create NestJS application with AppModule', async () => {
      // Import and call bootstrap function
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    });

    it('should configure security middleware with helmet', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(helmet).toHaveBeenCalledWith({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      });
      expect(mockApp.use).toHaveBeenCalledWith('helmet-middleware');
    });

    it('should configure CORS with all required origins', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(mockApp.enableCors).toHaveBeenCalledWith({
        origin: expect.arrayContaining([
          'https://dev.lowebi.com',
          'http://localhost:3000',
          'http://162.55.213.90:7612',
          'https://admin.dev.lowebi.com',
        ]),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
        ],
      });
    });

    it('should configure global validation pipe', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
        expect.any(ValidationPipe),
      );
    });

    it('should setup Swagger documentation', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(SwaggerModule.createDocument).toHaveBeenCalledWith(
        mockApp,
        expect.objectContaining({
          info: expect.objectContaining({
            title: 'Website Generator v2 - Complete API',
            version: '2.0.0',
          }),
        }),
      );

      expect(SwaggerModule.setup).toHaveBeenCalledWith(
        'api/docs',
        mockApp,
        'swagger-document',
        {
          swaggerOptions: {
            persistAuthorization: true,
          },
        },
      );
    });
  });

  describe('Port Configuration', () => {
    it('should use default port 7600 when PORT env not set', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(mockApp.listen).toHaveBeenCalledWith(7600);
    });

    it('should use PORT environment variable when set', async () => {
      process.env.PORT = '8080';

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(mockApp.listen).toHaveBeenCalledWith('8080');
    });

    it('should use nullish coalescing for port fallback', async () => {
      process.env.PORT = '0'; // Falsy but not nullish

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(mockApp.listen).toHaveBeenCalledWith('0');
    });
  });

  describe('Console Output', () => {
    it('should log server information in development mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '7600';

      const consoleSpy = jest.spyOn(console, 'log');

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Server running on http://localhost:7610',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📚 API Documentation available at http://localhost:7610/api/docs',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔍 Health check available at http://localhost:7610/api/health',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📊 System metrics available at http://localhost:7610/api/metrics',
      );
    });

    it('should log server information in production mode with HTTP', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '7600';
      process.env.HTTPS_ENABLED = 'false';

      const consoleSpy = jest.spyOn(console, 'log');

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Server running on http://162.55.213.90:7610',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📚 API Documentation available at http://162.55.213.90:7610/api/docs',
      );
    });

    it('should log server information in production mode with HTTPS', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '7600';
      process.env.HTTPS_ENABLED = 'true';

      const consoleSpy = jest.spyOn(console, 'log');

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Server running on https://162.55.213.90:7610',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📚 API Documentation available at https://162.55.213.90:7610/api/docs',
      );
    });

    it('should log production readiness status when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'log');

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔒 Production mode: Security headers enabled',
      );
      expect(consoleSpy).toHaveBeenCalledWith('🛡️ Rate limiting: Active');
      expect(consoleSpy).toHaveBeenCalledWith('🗄️ Database: Connected');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Production deployment ready');
    });

    it('should not log production status in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'log');

      const { bootstrap } = await import('./main');
      await bootstrap();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        '🔒 Production mode: Security headers enabled',
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        '✅ Production deployment ready',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle application creation errors', async () => {
      const error = new Error('Failed to create app');
      (NestFactory.create as jest.Mock).mockRejectedValue(error);

      const { bootstrap } = await import('./main');

      await expect(bootstrap()).rejects.toThrow('Failed to create app');
    });

    it('should handle listen errors', async () => {
      const error = new Error('Port already in use');
      mockListen.mockRejectedValue(error);

      const { bootstrap } = await import('./main');

      await expect(bootstrap()).rejects.toThrow('Port already in use');
    });
  });

  describe('ValidationPipe Configuration', () => {
    it('should configure ValidationPipe with correct options', async () => {
      const { bootstrap } = await import('./main');
      await bootstrap();

      const validationPipeCall = mockApp.useGlobalPipes.mock.calls[0][0];
      expect(validationPipeCall).toBeInstanceOf(ValidationPipe);

      // Access the private options to verify configuration
      const options = validationPipeCall.options;
      expect(options.whitelist).toBe(true);
      expect(options.forbidNonWhitelisted).toBe(true);
      expect(options.transform).toBe(true);
    });
  });
});

// Test the actual bootstrap function execution
describe('Bootstrap Function Integration', () => {
  // This test requires actual module loading without mocks
  it('should export bootstrap function', () => {
    // Import without mocks to verify the function exists
    jest.unmock('./main');
    const mainModule = require('./main');

    expect(typeof mainModule.bootstrap).toBe('function');
  });
});
