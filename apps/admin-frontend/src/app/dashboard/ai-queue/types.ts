export interface AiRequest {
  id: string;
  customerId: string;
  siteId: string;
  requestType: string;
  businessType: string;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  completedAt?: string;
  requestData?: {
    siteName?: string;
    businessType?: string;
    [key: string]: any;
  };
}