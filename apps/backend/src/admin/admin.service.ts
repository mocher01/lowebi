import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../auth/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import {
  DashboardStatsDto,
  SystemHealthDto,
  AdminActivityFeedDto,
  AdminActivityItemDto,
} from './dto/dashboard-stats.dto';
import {
  UpdateUserDto,
  UserListQueryDto,
  UserResponseDto,
  UserListResponseDto,
  AdminResetPasswordDto,
} from './dto/user-management.dto';
import {
  SessionResponseDto,
  SessionListResponseDto,
  TerminateSessionDto,
  BulkTerminateSessionsDto,
} from './dto/session-management.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      customerUsers,
      activeSessions,
      totalSessions,
      recentLogins,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isActive: false } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.sessionRepository.count({ where: { isActive: true } }),
      this.sessionRepository.count(),
      this.getRecentLoginsCount(),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      customerUsers,
      activeSessions,
      totalSessions,
      recentLogins,
      lastUpdated: new Date(),
    };
  }

  private async getRecentLoginsCount(): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.created_at >= :twentyFourHoursAgo', {
        twentyFourHoursAgo,
      })
      .getCount();
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealthDto> {
    const startTime = Date.now();

    try {
      // Test database connection
      await this.userRepository.query('SELECT 1');
      const dbResponseTime = Date.now() - startTime;

      // Get memory usage (basic implementation)
      const memoryUsage = process.memoryUsage();

      return {
        status: 'healthy',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: new Date(Date.now() - process.uptime() * 1000),
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'critical',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: new Date(Date.now() - process.uptime() * 1000),
        database: {
          status: 'disconnected',
          responseTime: -1,
        },
      };
    }
  }

  // Admin Activity Feed
  async getAdminActivity(
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminActivityFeedDto> {
    const [activities, total] = await this.auditLogRepository.findAndCount({
      relations: ['adminUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activityItems: AdminActivityItemDto[] = activities.map(
      (activity) => ({
        id: activity.id,
        action: activity.action,
        adminUserEmail: activity.adminUser.email,
        targetResource: activity.targetResource,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
      }),
    );

    return {
      activities: activityItems,
      total,
      page,
      limit,
    };
  }

  // User Management
  async getUsers(query: UserListQueryDto): Promise<UserListResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.sessions',
        'sessions',
        'sessions.isActive = :isActiveSession',
        { isActiveSession: true },
      );

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    const userResponses: UserResponseDto[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      activeSessionsCount: user.sessions?.length || 0,
    }));

    return {
      users: userResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const activeSessions =
      user.sessions?.filter((session) => session.isActive) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      activeSessionsCount: activeSessions.length,
    };
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    adminUserId: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Log admin action
    await this.logAdminAction(
      AuditAction.USER_UPDATED,
      adminUserId,
      id,
      'user',
      { updatedFields: Object.keys(updateUserDto) },
    );

    return this.getUserById(id);
  }

  async deleteUser(id: string, adminUserId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Don't allow deletion of admin users
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete admin users');
    }

    // Soft delete by deactivating
    user.isActive = false;
    await this.userRepository.save(user);

    // Terminate all user sessions
    await this.sessionRepository.update({ userId: id }, { isActive: false });

    // Log admin action
    await this.logAdminAction(
      AuditAction.USER_DELETED,
      adminUserId,
      id,
      'user',
      { email: user.email },
    );
  }

  async resetUserPassword(
    id: string,
    resetPasswordDto: AdminResetPasswordDto,
    adminUserId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      saltRounds,
    );

    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    // Optionally terminate all user sessions if force change password
    if (resetPasswordDto.forceChangePassword) {
      await this.sessionRepository.update({ userId: id }, { isActive: false });
    }

    // Log admin action
    await this.logAdminAction(
      AuditAction.USER_PASSWORD_RESET,
      adminUserId,
      id,
      'user',
      { forceChangePassword: resetPasswordDto.forceChangePassword },
    );
  }

  // Session Management
  async getAllSessions(
    page: number = 1,
    limit: number = 20,
  ): Promise<SessionListResponseDto> {
    const [sessions, total] = await this.sessionRepository.findAndCount({
      relations: ['user'],
      order: { lastActiveAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const sessionResponses: SessionResponseDto[] = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      userFullName: session.user.fullName,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    }));

    return {
      sessions: sessionResponses,
      total,
      page,
      limit,
    };
  }

  async terminateSession(
    terminateSessionDto: TerminateSessionDto,
    adminUserId: string,
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: terminateSessionDto.sessionId },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${terminateSessionDto.sessionId} not found`,
      );
    }

    session.isActive = false;
    await this.sessionRepository.save(session);

    // Log admin action
    await this.logAdminAction(
      AuditAction.SESSION_TERMINATED,
      adminUserId,
      session.userId,
      'session',
      {
        sessionId: session.id,
        userEmail: session.user.email,
        reason: terminateSessionDto.reason,
      },
    );
  }

  async terminateAllUserSessions(
    bulkTerminateDto: BulkTerminateSessionsDto,
    adminUserId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: bulkTerminateDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${bulkTerminateDto.userId} not found`,
      );
    }

    await this.sessionRepository.update(
      { userId: bulkTerminateDto.userId, isActive: true },
      { isActive: false },
    );

    // Log admin action
    await this.logAdminAction(
      AuditAction.BULK_SESSION_TERMINATED,
      adminUserId,
      bulkTerminateDto.userId,
      'sessions',
      {
        userEmail: user.email,
        reason: bulkTerminateDto.reason,
      },
    );
  }

  // Audit Logging
  private async logAdminAction(
    action: AuditAction,
    adminUserId: string,
    targetUserId?: string,
    targetResource?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        action,
        adminUserId,
        targetUserId,
        targetResource,
        metadata,
        ipAddress,
        userAgent,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Failed to log admin action', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async logDashboardAccess(
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAdminAction(
      AuditAction.DASHBOARD_ACCESSED,
      adminUserId,
      undefined,
      'dashboard',
      undefined,
      ipAddress,
      userAgent,
    );
  }
}
