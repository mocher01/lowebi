import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Session } from '../../auth/entities/session.entity';
import {
  VerificationToken,
  TokenType,
} from '../../auth/entities/password-reset-token.entity';
import {
  CustomerSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/customer-subscription.entity';
import {
  CustomerRegisterDto,
  CustomerLoginDto,
  CustomerProfileUpdateDto,
  CustomerAuthResponseDto,
} from '../dto/customer-auth.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerDto: CustomerRegisterDto,
  ): Promise<CustomerAuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: false, // Will be verified via email
    });

    const savedUser = await this.userRepository.save(user);

    // Create default free subscription
    const subscription = this.subscriptionRepository.create({
      customerId: savedUser.id,
      customer: savedUser,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      price: 0,
      sitesLimit: 1,
      storageLimitGb: 1,
      bandwidthLimitGb: 10,
      customDomainAllowed: false,
      aiGenerationLimit: 10,
      supportLevel: 'basic',
    });

    await this.subscriptionRepository.save(subscription);

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

    // Create session
    await this.createSession(savedUser.id, refreshToken);

    // Send verification email (implement email service)
    await this.sendVerificationEmail(savedUser);

    return this.buildAuthResponse(savedUser, accessToken, refreshToken);
  }

  async login(loginDto: CustomerLoginDto): Promise<CustomerAuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email, role: UserRole.CUSTOMER },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Create session (extend session time if rememberMe is true)
    const sessionDuration = loginDto.rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // 30 days vs 1 day
    await this.createSession(user.id, refreshToken, sessionDuration);

    return this.buildAuthResponse(user, accessToken, refreshToken);
  }

  async refreshToken(refreshToken: string): Promise<CustomerAuthResponseDto> {
    // Find session with refresh token
    const session = await this.sessionRepository.findOne({
      where: { refreshToken, isActive: true },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if user is still active
    if (!session.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(session.user);

    // Update session with new refresh token
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepository.save(session);

    return this.buildAuthResponse(session.user, accessToken, newRefreshToken);
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CUSTOMER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get subscription info
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId: userId },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            sitesLimit: subscription.sitesLimit,
            customDomainAllowed: subscription.customDomainAllowed,
          }
        : null,
    };
  }

  async updateProfile(
    userId: string,
    updateDto: CustomerProfileUpdateDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CUSTOMER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user fields
    Object.assign(user, updateDto);
    const updatedUser = await this.userRepository.save(user);

    return this.getProfile(updatedUser.id);
  }

  async logout(userId: string): Promise<void> {
    // Deactivate all sessions for the user
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email, role: UserRole.CUSTOMER },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token
    const resetToken = this.generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    const verificationToken = this.verificationTokenRepository.create({
      token: resetToken,
      type: TokenType.PASSWORD_RESET,
      userId: user.id,
      expiresAt,
    });

    await this.verificationTokenRepository.save(verificationToken);

    // Send password reset email (implement email service)
    await this.sendPasswordResetEmail(user, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
        isUsed: false,
      },
      relations: ['user'],
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.userRepository.update(
      { id: verificationToken.userId },
      { passwordHash },
    );

    // Mark token as used
    verificationToken.isUsed = true;
    verificationToken.usedAt = new Date();
    await this.verificationTokenRepository.save(verificationToken);

    // Deactivate all sessions for security
    await this.sessionRepository.update(
      { userId: verificationToken.userId },
      { isActive: false },
    );
  }

  async verifyEmail(token: string): Promise<void> {
    // Find valid verification token
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: {
        token,
        type: TokenType.EMAIL_VERIFICATION,
        isUsed: false,
      },
      relations: ['user'],
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user email verification status
    await this.userRepository.update(
      { id: verificationToken.userId },
      { emailVerified: true },
    );

    // Mark token as used
    verificationToken.isUsed = true;
    verificationToken.usedAt = new Date();
    await this.verificationTokenRepository.save(verificationToken);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CUSTOMER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Send verification email
    await this.sendVerificationEmail(user);
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'customer', // Add customer token type for identification
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { ...payload, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    duration = 7 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const session = this.sessionRepository.create({
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + duration),
      isActive: true,
    });

    await this.sessionRepository.save(session);
  }

  private buildAuthResponse(
    user: User,
    accessToken: string,
    refreshToken: string,
  ): any {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.emailVerified,
        subscriptionStatus: 'active', // TODO: Get from subscription
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  private generateRandomToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    // Generate verification token
    const verificationToken = this.generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token
    const token = this.verificationTokenRepository.create({
      token: verificationToken,
      type: TokenType.EMAIL_VERIFICATION,
      userId: user.id,
      expiresAt,
    });

    await this.verificationTokenRepository.save(token);

    // TODO: Implement email service integration
    console.log(
      `Verification email for ${user.email} with token: ${verificationToken}`,
    );
  }

  private async sendPasswordResetEmail(
    user: User,
    resetToken: string,
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log(
      `Password reset email for ${user.email} with token: ${resetToken}`,
    );
  }
}
