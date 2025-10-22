import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import {
  DashboardStatsDto,
  SystemHealthDto,
  AdminActivityFeedDto,
} from './dto/dashboard-stats.dto';
import {
  UpdateUserDto,
  UserListQueryDto,
  UserResponseDto,
  UserListResponseDto,
  AdminResetPasswordDto,
} from './dto/user-management.dto';
import {
  SessionListResponseDto,
  TerminateSessionDto,
  BulkTerminateSessionsDto,
} from './dto/session-management.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard Endpoints
  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description:
      'Retrieve comprehensive statistics for the admin dashboard including user counts, active sessions, and system metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<DashboardStatsDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Log dashboard access (only if user is authenticated)
    if (user?.id) {
      await this.adminService.logDashboardAccess(user.id, ipAddress, userAgent);
    }

    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({
    summary: 'Get admin activity feed',
    description: 'Retrieve recent admin activities with pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin activity feed retrieved successfully',
    type: AdminActivityFeedDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @HttpCode(HttpStatus.OK)
  async getAdminActivity(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<AdminActivityFeedDto> {
    return this.adminService.getAdminActivity(page, limit);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get system health status',
    description:
      'Retrieve comprehensive system health information including database status, memory usage, and uptime',
  })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
    type: SystemHealthDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @HttpCode(HttpStatus.OK)
  async getSystemHealth(): Promise<SystemHealthDto> {
    return this.adminService.getSystemHealth();
  }

  // User Management Endpoints
  @Get('users')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'List all users',
    description:
      'Get paginated list of all users with filtering and search capabilities',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search in email, first name, or last name',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (email, createdAt, updatedAt, lastName)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
    type: UserListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Query() query: UserListQueryDto,
  ): Promise<UserListResponseDto> {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update user information including email, name, role, and status',
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or email already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.adminService.updateUser(id, updateUserDto, user.id);
  }

  @Delete('users/:id')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Delete/deactivate user',
    description:
      'Soft delete a user by deactivating their account and terminating all sessions',
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete admin users',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.adminService.deleteUser(id, user.id);
  }

  @Post('users/:id/reset-password')
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Admin-initiated password reset for any user account',
  })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.adminService.resetUserPassword(id, resetPasswordDto, user.id);
    return { message: 'Password reset successfully' };
  }

  // Session Management Endpoints
  @Get('sessions')
  @ApiTags('Session Management')
  @ApiOperation({
    summary: 'List all active sessions',
    description: 'Get paginated list of all user sessions across the system',
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
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions list retrieved successfully',
    type: SessionListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @HttpCode(HttpStatus.OK)
  async getAllSessions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<SessionListResponseDto> {
    return this.adminService.getAllSessions(page, limit);
  }

  @Delete('sessions/:sessionId')
  @ApiTags('Session Management')
  @ApiOperation({
    summary: 'Terminate specific session',
    description: 'Forcefully terminate a specific user session',
  })
  @ApiParam({ name: 'sessionId', type: String, description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session terminated successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async terminateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: { reason?: string } = {},
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const terminateSessionDto: TerminateSessionDto = {
      sessionId,
      reason: body.reason,
    };

    await this.adminService.terminateSession(terminateSessionDto, user.id);
    return { message: 'Session terminated successfully' };
  }

  @Post('sessions/terminate-user/:userId')
  @ApiTags('Session Management')
  @ApiOperation({
    summary: 'Terminate all user sessions',
    description: 'Forcefully terminate all active sessions for a specific user',
  })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'All user sessions terminated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async terminateAllUserSessions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { reason?: string } = {},
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const bulkTerminateDto: BulkTerminateSessionsDto = {
      userId,
      reason: body.reason,
    };

    await this.adminService.terminateAllUserSessions(bulkTerminateDto, user.id);
    return { message: 'All user sessions terminated successfully' };
  }
}
