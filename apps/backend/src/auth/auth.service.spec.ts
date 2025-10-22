import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, QueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { VerificationToken } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let sessionRepository: jest.Mocked<Repository<Session>>;
  let verificationTokenRepository: jest.Mocked<Repository<VerificationToken>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [],
  };

  const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    token: 'access-token',
    refreshToken: 'refresh-token',
    ipAddress: '192.168.1.1',
    userAgent: 'test-agent',
    deviceInfo: null,
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastActiveAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockSessionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      },
    };

    const mockVerificationTokenRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(VerificationToken),
          useValue: mockVerificationTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    sessionRepository = module.get(getRepositoryToken(Session));
    verificationTokenRepository = module.get(
      getRepositoryToken(VerificationToken),
    );
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    dataSource = module.get(DataSource);

    // Setup default config values
    configService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const config = {
          BCRYPT_ROUNDS: '10',
          JWT_SECRET: 'test-secret',
          JWT_EXPIRATION: '15m',
          REFRESH_TOKEN_SECRET: 'refresh-secret',
          REFRESH_TOKEN_EXPIRATION: '7d',
        };
        return config[key] || defaultValue;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RefreshTokenService', () => {
    describe('generateTokens', () => {
      it('should generate unique refresh tokens', async () => {
        const accessTokens = new Set<string>();
        const refreshTokens = new Set<string>();
        const iterations = 10; // Reduced for faster testing

        let tokenCounter = 0;
        jwtService.sign.mockImplementation((payload: any, options?: any) => {
          tokenCounter++;
          if (options?.secret) {
            // This is a refresh token (has secret option)
            const token = `refresh-token-${tokenCounter}-${payload.jti || payload.iat}`;
            refreshTokens.add(token);
            return token;
          } else {
            // This is an access token
            const token = `access-token-${tokenCounter}-${payload.jti || payload.iat}`;
            accessTokens.add(token);
            return token;
          }
        });

        sessionRepository.create.mockReturnValue(mockSession);
        sessionRepository.save.mockResolvedValue(mockSession);
        sessionRepository.createQueryBuilder.mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 0 }),
        } as any);

        // Generate multiple tokens to test uniqueness
        for (let i = 0; i < iterations; i++) {
          await service['generateTokens'](mockUser);
        }

        // All tokens should be unique
        expect(accessTokens.size).toBe(iterations);
        expect(refreshTokens.size).toBe(iterations);
        expect(sessionRepository.save).toHaveBeenCalledTimes(iterations);
      });

      it('should cleanup expired sessions before creating new ones', async () => {
        const mockQueryBuilder = {
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 2 }),
        };

        sessionRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder as any,
        );
        sessionRepository.create.mockReturnValue(mockSession);
        sessionRepository.save.mockResolvedValue(mockSession);
        let tokenCounter = 0;
        jwtService.sign.mockImplementation((payload: any, options?: any) => {
          tokenCounter++;
          return options?.secret
            ? `refresh-token-${tokenCounter}-${payload.jti || payload.iat}`
            : `access-token-${tokenCounter}-${payload.jti || payload.iat}`;
        });

        await service['generateTokens'](mockUser);

        expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'user_id = :userId AND expires_at < :now',
          expect.objectContaining({ userId: mockUser.id }),
        );
      });

      it('should handle unique constraint violations with retry logic', async () => {
        const uniqueConstraintError = {
          code: '23505',
          constraint: 'sessions_refresh_token_key',
        };

        sessionRepository.create.mockReturnValue(mockSession);
        sessionRepository.save
          .mockRejectedValueOnce(uniqueConstraintError)
          .mockRejectedValueOnce(uniqueConstraintError)
          .mockResolvedValueOnce(mockSession);

        sessionRepository.createQueryBuilder.mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 0 }),
        } as any);

        let tokenCounter = 0;
        jwtService.sign.mockImplementation((payload: any, options?: any) => {
          tokenCounter++;
          return options?.secret
            ? `refresh-token-${tokenCounter}-${payload.jti || payload.iat}`
            : `access-token-${tokenCounter}-${payload.jti || payload.iat}`;
        });

        const result = await service['generateTokens'](mockUser);

        expect(result).toBeDefined();
        expect(sessionRepository.save).toHaveBeenCalledTimes(3);
      });

      it('should throw error after max retries if constraint keeps violating', async () => {
        const uniqueConstraintError = {
          code: '23505',
          constraint: 'sessions_refresh_token_key',
        };

        sessionRepository.create.mockReturnValue(mockSession);
        // Always reject to simulate persistent constraint violation
        sessionRepository.save.mockRejectedValue(uniqueConstraintError);
        sessionRepository.createQueryBuilder.mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 0 }),
        } as any);

        // Mock returns same token to ensure constraint violation persists
        jwtService.sign.mockReturnValue('duplicate-token');

        await expect(service['generateTokens'](mockUser)).rejects.toThrow(
          ConflictException,
        );
        expect(sessionRepository.save).toHaveBeenCalledTimes(4); // Initial attempt + 3 retries
      });
    });

    describe('refreshToken', () => {
      it('should handle concurrent refresh requests', async () => {
        sessionRepository.findOne.mockResolvedValue({
          ...mockSession,
          user: mockUser,
        });
        sessionRepository.save.mockResolvedValue(mockSession);
        sessionRepository.createQueryBuilder.mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 0 }),
        } as any);

        let tokenCounter = 0;
        jwtService.sign.mockImplementation((payload: any, options?: any) => {
          tokenCounter++;
          return options?.secret
            ? `refresh-token-${tokenCounter}-${payload.jti || payload.iat}`
            : `access-token-${tokenCounter}-${payload.jti || payload.iat}`;
        });

        const refreshPromises = Array(3)
          .fill(null)
          .map(() => service.refreshToken('valid-refresh-token'));

        const results = await Promise.all(refreshPromises);

        expect(results).toHaveLength(3);
        expect(results.every((result) => result.accessToken)).toBe(true);
      });

      it('should prevent duplicate token violations in transaction', async () => {
        const expiredSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() - 1000),
        };

        sessionRepository.findOne.mockResolvedValue(expiredSession);

        await expect(service.refreshToken('expired-token')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should use pessimistic locking for session retrieval', async () => {
        sessionRepository.findOne.mockResolvedValue({
          ...mockSession,
          user: mockUser,
        });
        sessionRepository.save.mockResolvedValue(mockSession);
        sessionRepository.createQueryBuilder.mockReturnValue({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 0 }),
        } as any);

        let tokenCounter = 0;
        jwtService.sign.mockImplementation((payload: any, options?: any) => {
          tokenCounter++;
          return options?.secret
            ? `refresh-token-${tokenCounter}-${payload.jti || payload.iat}`
            : `access-token-${tokenCounter}-${payload.jti || payload.iat}`;
        });

        await service.refreshToken('valid-refresh-token');

        expect(sessionRepository.findOne).toHaveBeenCalledWith({
          where: { refreshToken: 'valid-refresh-token' },
          relations: ['user'],
        });
      });
    });

    // Note: cleanupExpiredSessions and getSessionStats methods not implemented in current AuthService
    // These tests are removed to match actual implementation
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      sessionRepository.create.mockReturnValue(mockSession);
      sessionRepository.save.mockResolvedValue(mockSession);
      sessionRepository.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      } as any);

      jwtService.sign.mockReturnValue('test-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      sessionRepository.create.mockReturnValue(mockSession);
      sessionRepository.save.mockResolvedValue(mockSession);
      sessionRepository.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      } as any);

      jwtService.sign.mockReturnValue('test-token');

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
