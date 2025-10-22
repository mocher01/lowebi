/**
 * Admin Portal API Client for V2 Backend Integration
 * Handles all API communications with the NestJS backend
 */

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface QueueStats {
  total: number;
  pending: number;
  assigned: number;
  processing: number;
  completed: number;
  rejected: number;
  averageProcessingTime: number;
  totalRevenue: number;
}

export interface AiRequest {
  id: number;
  customerId: string;
  siteId?: string;
  requestType: string;
  businessType: string;
  status: string;
  priority: string;
  requestData: any;
  adminId?: string;
  generatedContent?: any;
  processingNotes?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Relations
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  site?: {
    id: string;
    name: string;
  };
  wizardSession?: {
    id: string;
    siteName: string;
    businessType: string;
  };
}

export interface QueueResponse {
  requests: AiRequest[];
  total: number;
  page: number;
  totalPages: number;
}

class AdminAPIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = this.getBaseURL();
  }

  private getBaseURL(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:7610';
      } else if (hostname === 'admin.dev.lowebi.com') {
        return '';  // Use same origin - nginx will proxy /admin/* to backend
      } else if (hostname === 'dev.lowebi.com') {
        return '';  // Use same origin
      } else if (hostname.includes('162.55.213.90')) {
        return 'http://162.55.213.90:7610';
      }
    }
    
    return 'http://localhost:7610'; // Default fallback
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      const errorMessage = error.message || `HTTP ${response.status}`;
      
      // Add more context for debugging
      console.error(`API Error: ${response.status} ${response.statusText} - ${errorMessage}`);
      console.error(`Request URL: ${response.url}`);
      
      // For 401 errors, also log token status
      if (response.status === 401) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        console.error(`Token present: ${!!token}, length: ${token?.length || 0}`);
      }
      
      throw new Error(errorMessage);
    }
    return response.json();
  }

  /**
   * Admin Authentication
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return this.handleResponse<LoginResponse>(response);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    return this.handleResponse<LoginResponse>(response);
  }

  /**
   * Queue Management
   */
  async getQueueStats(): Promise<QueueStats> {
    const response = await fetch(`${this.baseURL}/admin/queue/stats`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<QueueStats>(response);
  }

  async getQueue(
    page: number = 1,
    limit: number = 50,
    filters: {
      status?: string;
      requestType?: string;
      businessType?: string;
      priority?: string;
      fromDate?: string;
      toDate?: string;
    } = {}
  ): Promise<QueueResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    console.log(`🔍 Fetching queue: ${this.baseURL}/admin/queue?${params}`);
    const headers = this.getAuthHeaders();
    console.log('Headers:', Object.keys(headers));

    const response = await fetch(`${this.baseURL}/admin/queue?${params}`, {
      headers,
    });

    return this.handleResponse<QueueResponse>(response);
  }

  async getRequest(id: number): Promise<AiRequest> {
    const response = await fetch(`${this.baseURL}/admin/queue/${id}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AiRequest>(response);
  }

  /**
   * Request Processing
   */
  async assignRequest(id: number): Promise<AiRequest> {
    const response = await fetch(`${this.baseURL}/admin/queue/${id}/assign`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AiRequest>(response);
  }

  async startProcessing(id: number): Promise<AiRequest> {
    const response = await fetch(`${this.baseURL}/admin/queue/${id}/start`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AiRequest>(response);
  }

  async completeRequest(id: number, data: { content: any }): Promise<AiRequest> {
    const response = await fetch(`${this.baseURL}/admin/queue/${id}/complete`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        generatedContent: data.content, // Already parsed JSON object
      }),
    });

    return this.handleResponse<AiRequest>(response);
  }

  async rejectRequest(id: number, reason: string): Promise<AiRequest> {
    const response = await fetch(`${this.baseURL}/admin/queue/${id}/reject`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    return this.handleResponse<AiRequest>(response);
  }

  /**
   * System Information
   */
  async getSystemHealth(): Promise<{ status: string; uptime: number; memory: any }> {
    const response = await fetch(`${this.baseURL}/admin/system/health`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getDashboardStats(): Promise<{
    customers: { total: number; active: number };
    sites: { total: number; active: number };
    aiQueue: QueueStats;
    systemHealth: { status: string };
  }> {
    const [queueStats] = await Promise.all([
      this.getQueueStats(),
    ]);

    // For now, return queue stats as main dashboard data
    // TODO: Add actual customer and site stats when endpoints available
    return {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: queueStats,
      systemHealth: { status: 'Healthy' },
    };
  }
}

export const apiClient = new AdminAPIClient();
export default apiClient;