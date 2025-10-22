import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';

export class DashboardStatsDto {
  @IsNumber()
  totalUsers: number;

  @IsNumber()
  activeUsers: number;

  @IsNumber()
  inactiveUsers: number;

  @IsNumber()
  adminUsers: number;

  @IsNumber()
  customerUsers: number;

  @IsNumber()
  activeSessions: number;

  @IsNumber()
  totalSessions: number;

  @IsNumber()
  recentLogins: number; // last 24 hours

  @IsDate()
  lastUpdated: Date;
}

export class SystemHealthDto {
  @IsString()
  status: 'healthy' | 'warning' | 'critical';

  @IsString()
  version: string;

  @IsDate()
  uptime: Date;

  @IsOptional()
  database?: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };

  @IsOptional()
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class AdminActivityItemDto {
  @IsString()
  id: string;

  @IsString()
  action: string;

  @IsString()
  adminUserEmail: string;

  @IsOptional()
  @IsString()
  targetResource?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsDate()
  createdAt: Date;
}

export class AdminActivityFeedDto {
  activities: AdminActivityItemDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}
