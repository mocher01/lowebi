/**
 * TypeScript types and interfaces for AI Queue Management System
 */

// Import and re-export enums for easier use
import {
  RequestType,
  RequestStatus,
  RequestPriority,
} from '../entities/ai-request.entity';
import { AdminAction, TargetType } from '../entities/admin-activity-log.entity';
import { ChangeType } from '../entities/ai-request-history.entity';
import {
  CustomerStatus,
  CustomerTier,
} from '../../customer/entities/customer.entity';

// Re-export enums
export {
  RequestType,
  RequestStatus,
  RequestPriority,
  AdminAction,
  TargetType,
  ChangeType,
  CustomerStatus,
  CustomerTier,
};

// Request Data Interfaces
export interface WizardRequestData {
  companyName?: string;
  industry?: string;
  targetAudience?: string;
  keyServices?: string[];
  brandValues?: string[];
  competitorUrls?: string[];
  existingContent?: string;
  specificRequirements?: string;
  contentLength?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'friendly' | 'casual' | 'authoritative';
  language?: string;
  wizardStep?: number;
  [key: string]: any;
}

export interface GeneratedContentData {
  content?: string;
  metadata?: {
    modelUsed?: string;
    tokensConsumed?: number;
    generationTime?: number;
    confidence?: number;
  };
  variations?: string[];
  keywords?: string[];
  [key: string]: any;
}

export interface CustomerPreferences {
  aiContentPreferences?: {
    tone?: string;
    style?: string;
    terminology?: string[];
  };
  notificationSettings?: {
    email?: boolean;
    sms?: boolean;
  };
  [key: string]: any;
}

export interface CustomerBillingInfo {
  stripeCustomerId?: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  billingAddress?: any;
}

// Activity Log Interfaces
export interface ActivityLogDetails {
  previousValue?: any;
  newValue?: any;
  reason?: string;
  batchSize?: number;
  filters?: any;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
  [key: string]: any;
}

export interface HistoryChangeDetails {
  automaticChange?: boolean;
  systemGenerated?: boolean;
  batchOperation?: boolean;
  validationErrors?: string[];
  processingTime?: number;
  apiResponse?: any;
  customerFeedback?: {
    rating?: number;
    comment?: string;
  };
  adminNotes?: string;
  [key: string]: any;
}

// Queue Management Interfaces
export interface QueueFilters {
  status?: RequestStatus[];
  requestType?: RequestType[];
  priority?: RequestPriority[];
  assignedAdmin?: string[];
  customerTier?: CustomerTier[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  businessType?: string[];
  hasErrors?: boolean;
  isOverdue?: boolean;
}

export interface QueueStats {
  total: number;
  pending: number;
  assigned: number;
  processing: number;
  completed: number;
  rejected: number;
  cancelled: number;
  failed: number;
  overdue: number;
  avgProcessingTime: number;
  totalCost: number;
}

export interface AdminStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  avgProcessingTime: number;
  customerRating: number;
  totalEarnings: number;
}

// API Response Interfaces
export interface AiRequestResponse {
  id: string;
  customerId: string;
  siteId: string;
  requestType: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  businessType: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  customer?: {
    id: string;
    companyName?: string;
    businessType?: string;
    tier: CustomerTier;
    user: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
  admin?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CreateAiRequestDto {
  customerId: string;
  siteId: string;
  requestType: RequestType;
  businessType: string;
  terminology?: string;
  requestData: WizardRequestData;
  priority?: RequestPriority;
  wizardSessionId?: string;
  estimatedCost?: number;
  expiresAt?: Date;
}

export interface UpdateAiRequestDto {
  status?: RequestStatus;
  priority?: RequestPriority;
  adminId?: string;
  processingNotes?: string;
  adminComments?: string;
  generatedContent?: GeneratedContentData;
  actualCost?: number;
  customerRating?: number;
  customerFeedback?: string;
}

export interface AssignRequestDto {
  adminId: string;
  priority?: RequestPriority;
  notes?: string;
}

export interface CompleteRequestDto {
  generatedContent: GeneratedContentData;
  actualCost?: number;
  processingNotes?: string;
  quality?: 'excellent' | 'good' | 'average' | 'poor';
}

export interface RejectRequestDto {
  reason: string;
  adminComments?: string;
  suggestedAction?: 'revise' | 'cancel' | 'reassign';
}

// Search and Pagination
export interface SearchParams {
  query?: string;
  filters?: QueueFilters;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'estimatedCost';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Notification Interfaces
export interface NotificationPayload {
  type:
    | 'ai_request_assigned'
    | 'ai_request_completed'
    | 'ai_request_rejected'
    | 'payment_required';
  requestId: string;
  customerId?: string;
  adminId?: string;
  title: string;
  message: string;
  data?: any;
}

// Validation Interfaces
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RequestValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// AI Processing Interfaces
export interface AIProcessingConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  stopSequences?: string[];
  systemPrompt?: string;
  userPrompt: string;
}

export interface AIProcessingResult {
  success: boolean;
  content?: string;
  tokensUsed: number;
  processingTime: number;
  confidence?: number;
  error?: string;
  metadata?: any;
}

// Export utility types
export type AiRequestWithRelations = AiRequestResponse;
export type CustomerWithUser = CustomerResponse;
export type AdminWithStats = AdminResponse;

// Customer Response Interface
export interface CustomerResponse {
  id: string;
  userId: string;
  companyName?: string;
  businessType?: string;
  status: CustomerStatus;
  tier: CustomerTier;
  sitesCount: number;
  aiRequestsCount: number;
  totalSpent: number;
  lastActivityAt?: Date;
  createdAt: Date;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
  };
}

// Admin Response Interface
export interface AdminResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  stats?: AdminStats;
  lastActivityAt?: Date;
}

// Constants
export const REQUEST_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const REQUEST_STATUSES = [
  'pending',
  'assigned',
  'processing',
  'completed',
  'rejected',
  'cancelled',
  'failed',
] as const;
export const REQUEST_TYPES = [
  'content',
  'images',
  'services',
  'hero',
  'about',
  'testimonials',
  'faq',
  'seo',
  'blog',
  'contact',
  'custom',
] as const;
export const CUSTOMER_TIERS = [
  'free',
  'basic',
  'premium',
  'enterprise',
] as const;
export const CUSTOMER_STATUSES = [
  'active',
  'inactive',
  'suspended',
  'pending_verification',
] as const;

// Type guards
export const isValidRequestStatus = (
  status: string,
): status is RequestStatus => {
  return REQUEST_STATUSES.includes(status as RequestStatus);
};

export const isValidRequestType = (type: string): type is RequestType => {
  return REQUEST_TYPES.includes(type as RequestType);
};

export const isValidPriority = (
  priority: string,
): priority is RequestPriority => {
  return REQUEST_PRIORITIES.includes(priority as any);
};
