import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  RefreshTokenDto,
  TokenResponseDto,
  UserResponseDto,
} from './dto/token-response.dto';
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
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new user account',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already exists or invalid data',
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password, returns JWT access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.authService.getProfile(user.id);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAllSessions(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.authService.logoutAllSessions(user.id);
    return { message: 'Logged out from all devices successfully' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getUserSessions(@CurrentUser() user: User) {
    return this.authService.getUserSessions(user.id);
  }

  // Admin-only endpoint example
  // Password Reset Flow
  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Initiate password reset',
    description:
      'Send password reset email to user. Returns success message regardless of email existence for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    type: PasswordResetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid email format',
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<PasswordResetResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    return this.authService.forgotPassword(
      forgotPasswordDto,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Complete password reset using token received via email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: PasswordResetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or expired token',
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<PasswordResetResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;

    return this.authService.resetPassword(resetPasswordDto, ipAddress);
  }

  // Email Verification Flow
  @Public()
  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Send new email verification token to user',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
    type: EmailVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already verified',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Req() req: Request,
  ): Promise<EmailVerificationResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    return this.authService.resendVerification(
      resendVerificationDto,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Complete email verification using token received via email',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: EmailVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or expired token',
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<EmailVerificationResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Get('admin/users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin test endpoint',
    description:
      'Test endpoint for admin role verification (deprecated - use /admin/users instead)',
  })
  @ApiResponse({ status: 200, description: 'Admin access confirmed' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(@CurrentUser() user: User) {
    // This would be implemented to return all users for admin
    return {
      message: 'Admin endpoint - list all users',
      requestedBy: user.email,
    };
  }
}
