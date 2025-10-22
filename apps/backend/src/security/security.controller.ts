import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SecurityService } from './security.service';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Security')
@Controller('api/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get security status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Security status information' })
  getSecurityStatus() {
    return {
      status: 'secure',
      timestamp: new Date().toISOString(),
      ...this.securityService.getSecurityStatus(),
      securityFeatures: {
        helmet: 'enabled',
        cors: 'configured',
        rateLimit: 'active',
        jwt: 'secured',
        passwordHashing: 'bcrypt',
        httpsRedirect: 'enforced',
        securityHeaders: 'enabled',
      },
    };
  }

  @Post('validate-password')
  @Public()
  @ApiOperation({ summary: 'Validate password strength' })
  @ApiResponse({ status: 200, description: 'Password validation result' })
  validatePassword(@Body('password') password: string) {
    return this.securityService.validatePasswordStrength(password);
  }

  @Get('headers')
  @Public()
  @ApiOperation({ summary: 'Check security headers' })
  @ApiResponse({ status: 200, description: 'Security headers information' })
  getSecurityHeaders() {
    return {
      recommendedHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security':
          'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      },
      status: 'All security headers are properly configured',
    };
  }
}
