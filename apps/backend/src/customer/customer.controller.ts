import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import {
  UpdateCustomerProfileDto,
  CustomerProfileResponseDto,
  CustomerSettingsDto,
} from './dto/customer-profile.dto';
import {
  CustomerDashboardStatsDto,
  CustomerActivityListDto,
  CustomerUsageMetricsDto,
} from './dto/customer-dashboard.dto';
import { ActivityType } from './entities/customer-activity.entity';

@ApiTags('Customer')
@Controller('api/customer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get customer profile',
    description: 'Retrieve current customer profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: CustomerProfileResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @UseInterceptors(CacheInterceptor)
  async getProfile(
    @CurrentUser() user: User,
  ): Promise<CustomerProfileResponseDto> {
    const startTime = performance.now();

    try {
      const profile = await this.customerService.getProfile(user.id);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Profile retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return profile;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get profile for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update customer profile',
    description: 'Update customer profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: CustomerProfileResponseDto,
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 updates per minute
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateCustomerProfileDto,
    @Req() req: Request,
  ): Promise<CustomerProfileResponseDto> {
    const startTime = performance.now();

    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      const updatedProfile = await this.customerService.updateProfile(
        user.id,
        updateDto,
        ipAddress,
        userAgent,
      );

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Profile updated for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return updatedProfile;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to update profile for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get customer dashboard statistics',
    description: 'Retrieve comprehensive dashboard statistics for the customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
    type: CustomerDashboardStatsDto,
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @UseInterceptors(CacheInterceptor)
  async getDashboardStats(
    @CurrentUser() user: User,
  ): Promise<CustomerDashboardStatsDto> {
    const startTime = performance.now();

    try {
      const stats = await this.customerService.getDashboardStats(user.id);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Dashboard stats retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return stats;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get dashboard stats for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Get customer activity log',
    description: 'Retrieve paginated customer activity history',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity log retrieved successfully',
    type: CustomerActivityListDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ActivityType,
    description: 'Filter by activity type',
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @UseInterceptors(CacheInterceptor)
  async getActivity(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: ActivityType,
  ): Promise<CustomerActivityListDto> {
    const startTime = performance.now();

    try {
      // Limit the maximum number of items per page
      const normalizedLimit = Math.min(Math.max(1, limit), 100);
      const normalizedPage = Math.max(1, page);

      const activities = await this.customerService.getActivity(
        user.id,
        normalizedPage,
        normalizedLimit,
        type,
      );

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Activity retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return activities;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get activity for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('settings')
  @ApiOperation({
    summary: 'Get customer settings',
    description: 'Retrieve customer account settings and preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
  })
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @UseInterceptors(CacheInterceptor)
  async getSettings(@CurrentUser() user: User) {
    const startTime = performance.now();

    try {
      const settings = await this.customerService.getSettings(user.id);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Settings retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return settings;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get settings for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Post('settings')
  @ApiOperation({
    summary: 'Update customer settings',
    description: 'Update customer account settings and preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  async updateSettings(
    @CurrentUser() user: User,
    @Body() settingsDto: CustomerSettingsDto,
    @Req() req: Request,
  ) {
    const startTime = performance.now();

    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      const updatedSettings = await this.customerService.updateSettings(
        user.id,
        settingsDto,
        ipAddress,
        userAgent,
      );

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Settings updated for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return updatedSettings;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to update settings for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('usage/metrics')
  @ApiOperation({
    summary: 'Get customer usage metrics',
    description: 'Retrieve detailed usage analytics and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage metrics retrieved successfully',
    type: CustomerUsageMetricsDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @UseInterceptors(CacheInterceptor)
  async getUsageMetrics(
    @CurrentUser() user: User,
  ): Promise<CustomerUsageMetricsDto> {
    const startTime = performance.now();

    try {
      const metrics = await this.customerService.getUsageMetrics(user.id);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Usage metrics retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return metrics;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get usage metrics for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get complete customer account summary',
    description:
      'Retrieve a comprehensive summary including profile, settings, stats, and recent activity',
  })
  @ApiResponse({
    status: 200,
    description: 'Account summary retrieved successfully',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute (expensive operation)
  @UseInterceptors(CacheInterceptor)
  async getAccountSummary(@CurrentUser() user: User) {
    const startTime = performance.now();

    try {
      const summary = await this.customerService.getAccountSummary(user.id);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Account summary retrieved for user ${user.id} in ${duration.toFixed(2)}ms`,
      );

      return summary;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(
        `Failed to get account summary for user ${user.id} after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Customer API health check',
    description: 'Quick health check endpoint for customer services',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer API is healthy',
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'customer-api',
      version: '2.0.0',
    };
  }
}
