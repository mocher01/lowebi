import { apiClient } from '@/lib/api-client';

// Types for admin API responses
export interface DashboardStats {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
  };
  sessionStats: {
    activeSessions: number;
    peakConcurrentSessions: number;
    averageSessionDuration: number;
    totalSessionsToday: number;
  };
  systemStats: {
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
    databaseConnections: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    activeConnections: number;
    maxConnections: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  lastChecked: string;
}

export interface AdminActivity {
  data: Array<{
    id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    targetType: string;
    targetId?: string;
    description: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
}

export interface Session {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress: string;
  country?: string;
  city?: string;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionListResponse {
  data: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AdminService {
  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  }

  async getAdminActivity(page = 1, limit = 20): Promise<AdminActivity> {
    const response = await apiClient.get('/admin/dashboard/activity', {
      params: { page, limit }
    });
    return response.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get('/admin/health');
    return response.data;
  }

  // User management endpoints
  async getUsers(query: UserListQuery = {}): Promise<UserListResponse> {
    const response = await apiClient.get('/admin/users', {
      params: query
    });
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reset-password`, {
      newPassword
    });
  }

  // Session management endpoints
  async getAllSessions(page = 1, limit = 20): Promise<SessionListResponse> {
    const response = await apiClient.get('/admin/sessions', {
      params: { page, limit }
    });
    return response.data;
  }

  async terminateSession(sessionId: string, reason?: string): Promise<void> {
    await apiClient.delete(`/admin/sessions/${sessionId}`, {
      data: { reason }
    });
  }

  async terminateAllUserSessions(userId: string, reason?: string): Promise<void> {
    await apiClient.post(`/admin/sessions/terminate-user/${userId}`, {
      reason
    });
  }
}

export const adminService = new AdminService();