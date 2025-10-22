import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserRole } from '../entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;
  let configService: ConfigService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    isActive: true,
    emailVerified: true,
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [],
  } as User;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Set default JWT_SECRET for tests
    mockConfigService.get.mockReturnValue('test-jwt-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create JwtStrategy with valid JWT_SECRET', () => {
      mockConfigService.get.mockReturnValue('test-jwt-secret');

      expect(() => {
        new JwtStrategy(configService, userRepository);
      }).not.toThrow();
    });

    it('should throw error when JWT_SECRET is not defined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => {
        new JwtStrategy(configService, userRepository);
      }).toThrow('JWT_SECRET is not defined in environment variables');
    });

    it('should throw error when JWT_SECRET is empty string', () => {
      mockConfigService.get.mockReturnValue('');

      expect(() => {
        new JwtStrategy(configService, userRepository);
      }).toThrow('JWT_SECRET is not defined in environment variables');
    });

    it('should throw error when JWT_SECRET is null', () => {
      mockConfigService.get.mockReturnValue(null);

      expect(() => {
        new JwtStrategy(configService, userRepository);
      }).toThrow('JWT_SECRET is not defined in environment variables');
    });

    it('should call configService.get with JWT_SECRET', () => {
      mockConfigService.get.mockReturnValue('test-jwt-secret');

      new JwtStrategy(configService, userRepository);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-jwt-secret');
    });

    it('should return user when valid payload and active user exists', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toBe(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-id',
        email: 'notfound@example.com',
        role: UserRole.CUSTOMER,
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
      });
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      // Since we're filtering by isActive: true, inactive user won't be returned
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
      });
    });

    it('should extract user ID from payload.sub', async () => {
      const userId = '456e7890-e89b-12d3-a456-426614174001';
      const payload: JwtPayload = {
        sub: userId,
        email: 'another@example.com',
        role: UserRole.ADMIN,
      };

      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        id: userId,
        email: 'another@example.com',
        role: UserRole.ADMIN,
      });

      await strategy.validate(payload);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
    });

    it('should handle different user roles correctly', async () => {
      const adminPayload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.ADMIN,
      };

      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockUserRepository.findOne.mockResolvedValue(adminUser);

      const result = await strategy.validate(adminPayload);

      expect(result).toBe(adminUser);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should handle repository errors gracefully', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findOne.mockRejectedValue(repositoryError);

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should validate payload structure with required fields', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await strategy.validate(payload);

      // Verify that the sub field is properly extracted
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
      });
    });

    it('should handle undefined payload.sub', async () => {
      const payload = {
        email: mockUser.email,
        role: mockUser.role,
      } as JwtPayload; // Intentionally missing sub

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: undefined, isActive: true },
      });
    });

    it('should return the exact user object from repository', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      const userFromDb = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
        lastLoginAt: new Date('2024-01-01'),
      };

      mockUserRepository.findOne.mockResolvedValue(userFromDb);

      const result = await strategy.validate(payload);

      expect(result).toBe(userFromDb);
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('inheritance and configuration', () => {
    it('should extend PassportStrategy with jwt Strategy', () => {
      mockConfigService.get.mockReturnValue('test-jwt-secret');

      const jwtStrategy = new JwtStrategy(configService, userRepository);

      expect(jwtStrategy).toBeInstanceOf(JwtStrategy);
      // Verify it's properly configured for JWT
      expect(jwtStrategy.validate).toBeDefined();
    });

    it('should be decorated with @Injectable', () => {
      // Verify the class has the Injectable decorator applied
      const decorators = Reflect.getMetadata('design:paramtypes', JwtStrategy);
      expect(decorators).toBeDefined();
    });
  });
});
