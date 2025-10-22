import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { Session } from './entities/session.entity';
import {
  VerificationToken,
  TokenType,
} from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto, UserResponseDto } from './dto/token-response.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
} from './dto/password-reset.dto';
import {
  ResendVerificationDto,
  VerifyEmailDto,
  EmailVerificationResponseDto,
} from './dto/email-verification.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(VerificationToken)
    private verificationTokenRepository: Repository<VerificationToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: UserRole.CUSTOMER,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    return this.generateTokens(savedUser);
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenResponseDto> {
    const { email, password, rememberMe } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user, ipAddress, userAgent, 0, rememberMe);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }

    return null;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.user);

    // Update session with new refresh token
    session.refreshToken = tokens.refreshToken;
    session.expiresAt = new Date(
      Date.now() + this.getRefreshTokenExpirationMs(),
    );
    await this.sessionRepository.save(session);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken },
    });

    if (session) {
      await this.sessionRepository.remove(session);
    }
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }

  private async generateTokens(
    user: User,
    ipAddress?: string,
    userAgent?: string,
    retryCount: number = 0,
    rememberMe: boolean = false,
  ): Promise<TokenResponseDto> {
    const MAX_RETRIES = 3;

    // Cleanup expired sessions for this user first
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId AND expires_at < :now', {
        userId: user.id,
        now: new Date(),
      })
      .execute();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000), // Add issued at timestamp to ensure uniqueness
      jti: crypto.randomUUID(), // Add unique JWT ID to guarantee unique tokens
    };

    const accessToken = this.jwtService.sign(payload);

    // Use different expiration times based on rememberMe
    const refreshTokenExpiration = rememberMe ? '30d' : '7d'; // 30 days if remembered, 7 days otherwise
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        iat: Math.floor(Date.now() / 1000), // Add issued at timestamp to ensure uniqueness
        jti: crypto.randomUUID(), // Add unique JWT ID to guarantee unique refresh tokens
      },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: refreshTokenExpiration,
      },
    );

    // Store session with appropriate expiration
    const expirationMs = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      : this.getRefreshTokenExpirationMs(); // default 7 days

    const session = this.sessionRepository.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + expirationMs),
    });

    try {
      await this.sessionRepository.save(session);
    } catch (error) {
      // Handle potential unique constraint violations gracefully
      if (error.code === '23505' && retryCount < MAX_RETRIES) {
        // PostgreSQL unique constraint violation
        console.warn(
          `Duplicate token detected, retrying with new token... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        );
        // Recursively retry with new unique payload
        return this.generateTokens(
          user,
          ipAddress,
          userAgent,
          retryCount + 1,
          rememberMe,
        );
      }
      if (retryCount >= MAX_RETRIES) {
        throw new ConflictException(
          'Unable to generate unique session token after maximum retries',
        );
      }
      throw error;
    }

    return new TokenResponseDto(accessToken, refreshToken, user);
  }

  private getRefreshTokenExpirationMs(): number {
    const expirationStr = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRATION',
      '7d',
    );
    // Convert '7d' to milliseconds (simple implementation)
    const match = expirationStr.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Password Reset Flow
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordResetResponseDto> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return new PasswordResetResponseDto(
        'If an account with that email exists, a password reset link has been sent.',
      );
    }

    // Invalidate any existing password reset tokens for this user
    await this.verificationTokenRepository.update(
      { userId: user.id, type: TokenType.PASSWORD_RESET, isUsed: false },
      { isUsed: true, usedAt: new Date() },
    );

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    const verificationToken = this.verificationTokenRepository.create({
      userId: user.id,
      type: TokenType.PASSWORD_RESET,
      token: resetToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.verificationTokenRepository.save(verificationToken);

    // TODO: Send email with reset link (placeholder for now)
    // In production, you would send an email here with a link like:
    // https://your-frontend.com/reset-password?token=${resetToken}
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return new PasswordResetResponseDto(
      'If an account with that email exists, a password reset link has been sent.',
      expiresAt,
    );
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
  ): Promise<PasswordResetResponseDto> {
    const { token, newPassword } = resetPasswordDto;

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
    const bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);

    // Update user password
    await this.userRepository.update(
      { id: verificationToken.userId },
      { passwordHash },
    );

    // Mark token as used
    verificationToken.isUsed = true;
    verificationToken.usedAt = new Date();
    await this.verificationTokenRepository.save(verificationToken);

    // Invalidate all user sessions (force re-login)
    await this.sessionRepository.update(
      { userId: verificationToken.userId },
      { isActive: false },
    );

    return new PasswordResetResponseDto(
      'Password has been reset successfully. Please log in with your new password.',
    );
  }

  // Email Verification Flow
  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<EmailVerificationResponseDto> {
    const { email } = resendVerificationDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Invalidate any existing verification tokens for this user
    await this.verificationTokenRepository.update(
      { userId: user.id, type: TokenType.EMAIL_VERIFICATION, isUsed: false },
      { isUsed: true, usedAt: new Date() },
    );

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token
    const tokenEntity = this.verificationTokenRepository.create({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
      token: verificationToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.verificationTokenRepository.save(tokenEntity);

    // TODO: Send verification email (placeholder for now)
    // In production, you would send an email here with a link like:
    // https://your-frontend.com/verify-email?token=${verificationToken}
    console.log(`Email verification token for ${email}: ${verificationToken}`);

    return new EmailVerificationResponseDto(
      'Verification email has been sent.',
      expiresAt,
    );
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponseDto> {
    const { token } = verifyEmailDto;

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

    return new EmailVerificationResponseDto(
      'Email has been successfully verified.',
    );
  }
}
