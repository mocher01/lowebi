export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface APIError {
  message: string;
  statusCode: number;
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  domain: string;
  template: string;
  configuration: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  sites: Site[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIRequest {
  id: string;
  customerId: string;
  siteId: string;
  type: 'content' | 'design' | 'seo';
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
  updatedAt: string;
}