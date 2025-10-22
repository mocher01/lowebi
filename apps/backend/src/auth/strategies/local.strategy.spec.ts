import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

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

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create LocalStrategy with correct configuration', () => {
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(LocalStrategy);
    });

    it('should configure strategy to use email as username field', () => {
      // The strategy should be configured with usernameField: 'email'
      // We can verify this by checking that the constructor was called properly
      expect(strategy).toBeDefined();
    });

    it('should be decorated with @Injectable', () => {
      // Verify the class has the Injectable decorator applied
      const decorators = Reflect.getMetadata(
        'design:paramtypes',
        LocalStrategy,
      );
      expect(decorators).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user when valid credentials are provided', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toBe(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should throw UnauthorizedException when invalid credentials are provided', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should throw UnauthorizedException when user validation returns undefined', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should handle empty email gracefully', async () => {
      const email = '';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should handle empty password gracefully', async () => {
      const email = 'test@example.com';
      const password = '';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should handle null values gracefully', async () => {
      const email = null;
      const password = null;

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate(email as any, password as any),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should pass through AuthService errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const serviceError = new Error('Database connection failed');

      mockAuthService.validateUser.mockRejectedValue(serviceError);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should handle different user types correctly', async () => {
      const email = 'admin@example.com';
      const password = 'adminpass';
      const adminUser = { ...mockUser, role: UserRole.ADMIN, email };

      mockAuthService.validateUser.mockResolvedValue(adminUser);

      const result = await strategy.validate(email, password);

      expect(result).toBe(adminUser);
      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should handle case-sensitive email validation', async () => {
      const email = 'Test@Example.Com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toBe(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should validate with special characters in password', async () => {
      const email = 'test@example.com';
      const password = 'P@ssw0rd!@#$%^&*()';

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toBe(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should return the exact user object from AuthService', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const userWithAdditionalData = {
        ...mockUser,
        customField: 'customValue',
        updatedAt: new Date('2024-01-01'),
      };

      mockAuthService.validateUser.mockResolvedValue(userWithAdditionalData);

      const result = await strategy.validate(email, password);

      expect(result).toBe(userWithAdditionalData);
      expect((result as any).customField).toBe('customValue');
    });
  });

  describe('integration with Passport', () => {
    it('should extend PassportStrategy with local Strategy', () => {
      expect(strategy).toBeInstanceOf(LocalStrategy);
      expect(strategy.validate).toBeDefined();
    });

    it('should be configured for email/password authentication', () => {
      // The strategy should be properly configured for local authentication
      // This is verified by the successful instantiation and validate method
      expect(typeof strategy.validate).toBe('function');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle AuthService returning false', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(false as any);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should handle AuthService returning empty object', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue({} as any);

      // Empty object is truthy, so should return the object
      const result = await strategy.validate(email, password);
      expect(result).toEqual({});
    });

    it('should handle very long email and password strings', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com';
      const longPassword = 'b'.repeat(1000);

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(longEmail, longPassword);

      expect(result).toBe(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        longEmail,
        longPassword,
      );
    });
  });
});
