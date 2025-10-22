import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerAuthService } from '../services/customer-auth.service';
import { User } from '../../auth/entities/user.entity';
import {
  CustomerRegisterDto,
  CustomerLoginDto,
  CustomerProfileUpdateDto,
  CustomerAuthResponseDto,
} from '../dto/customer-auth.dto';

@ApiTags('Customer Authentication')
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new customer account',
    description: 'Creates a new customer account with email verification',
  })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    type: CustomerAuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async register(
    @Body() registerDto: CustomerRegisterDto,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer login',
    description: 'Authenticate customer and return JWT tokens',
  })
  @ApiBody({ type: CustomerLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: CustomerAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Account disabled or not verified',
  })
  async login(
    @Body() loginDto: CustomerLoginDto,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh JWT token',
    description: 'Generate new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: CustomerAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer profile',
    description: 'Retrieve authenticated customer profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: CustomerAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@CurrentUser() user: User): Promise<any> {
    return this.customerAuthService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update customer profile',
    description: 'Update customer profile information',
  })
  @ApiBody({ type: CustomerProfileUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: CustomerAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: CustomerProfileUpdateDto,
  ): Promise<any> {
    return this.customerAuthService.updateProfile(user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Customer logout',
    description: 'Invalidate customer session and tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.customerAuthService.logout(user.id);
    return { message: 'Logout successful' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  @ApiResponse({
    status: 404,
    description: 'Email not found',
  })
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.customerAuthService.forgotPassword(email);
    return { message: 'Password reset email sent if account exists' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset customer password using reset token',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    await this.customerAuthService.resetPassword(token, newPassword);
    return { message: 'Password reset successful' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify customer email using verification token',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(
    @Body('token') token: string,
  ): Promise<{ message: string }> {
    await this.customerAuthService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Resend email verification to customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async resendVerification(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.customerAuthService.resendVerification(user.id);
    return { message: 'Verification email sent' };
  }
}
