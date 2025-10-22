'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// V2 API Types based on the backend DTOs
export interface WizardSessionData {
  id: string;
  sessionName?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  currentStep: 'BUSINESS_INFO' | 'TEMPLATE_SELECTION' | 'DESIGN_PREFERENCES' | 'CONTENT_CREATION' | 'AI_GENERATION' | 'CUSTOMIZATION' | 'FINAL_REVIEW' | 'DEPLOYMENT';
  completedSteps: string[];
  progressPercentage: number;
  businessInfo?: any;
  templateSelection?: any;
  designPreferences?: any;
  contentData?: any;
  aiGenerationRequests?: any;
  customizationSettings?: any;
  finalConfiguration?: any;
  deploymentConfig?: any;
}

export interface BusinessInfo {
  siteName: string;
  businessType: string;
  businessDescription?: string;
  targetAudience?: string;
  domain?: string;
  slogan?: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface V2AiRequest {
  id?: number;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'rejected' | 'failed';
  requestType: 'SERVICES' | 'HERO' | 'ABOUT' | 'TESTIMONIALS' | 'FAQ' | 'SEO' | 'IMAGES';
  generatedContent?: any;
  errorMessage?: string;
  estimatedTime?: number;
  actualCost?: number;
}

interface V2WizardContextType {
  // Session management
  session: WizardSessionData | null;
  isLoading: boolean;
  error: Error | null;

  // Session operations
  startWizard: (sessionName?: string) => Promise<void>;
  getSession: (sessionId: string) => Promise<void>;
  updateSession: (updateData: Partial<WizardSessionData>) => Promise<void>;
  completeWizard: (subdomain: string, deployImmediately?: boolean) => Promise<{ siteId: string; deploymentUrl?: string }>;

  // Step management
  saveBusinessInfo: (businessInfo: BusinessInfo) => Promise<void>;
  saveTemplateSelection: (templateData: any) => Promise<void>;
  saveDesignPreferences: (designData: any) => Promise<void>;

  // AI Integration
  generateAIContent: () => Promise<void>;
  getContentGenerationStatus: () => Promise<{ status: string; progress: number; content?: any }>;
  aiRequests: Record<string, V2AiRequest>;
  requestSpecificAIContent: (type: V2AiRequest['requestType'], requestData?: any) => Promise<void>;

  // Utilities
  refreshSession: () => Promise<void>;
}

const V2WizardContext = createContext<V2WizardContextType | undefined>(undefined);

export function V2WizardProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WizardSessionData | null>(null);
  const [aiRequests, setAiRequests] = useState<Record<string, V2AiRequest>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Start a new wizard session
  const startWizard = useCallback(async (sessionName?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post('/customer/wizard/start', {
        sessionName: sessionName || `Site Web ${new Date().toLocaleDateString('fr-FR')}`
      });

      if (response.data) {
        setSession(response.data);
        // Store session ID in localStorage for recovery
        localStorage.setItem('currentWizardSession', response.data.id);
      }
    } catch (error) {
      console.error('Failed to start wizard:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get existing wizard session
  const getSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get(`/customer/wizard/${sessionId}`);
      if (response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to get wizard session:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update wizard session
  const updateSession = useCallback(async (updateData: Partial<WizardSessionData>) => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      const response = await apiClient.put(`/customer/wizard/${session.id}`, updateData);
      if (response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to update wizard session:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Save business information step
  const saveBusinessInfo = useCallback(async (businessInfo: BusinessInfo) => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/wizard/${session.id}/business-info`, businessInfo);
      if (response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to save business info:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Save template selection step
  const saveTemplateSelection = useCallback(async (templateData: any) => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/wizard/${session.id}/template-selection`, templateData);
      if (response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to save template selection:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Save design preferences step
  const saveDesignPreferences = useCallback(async (designData: any) => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/wizard/${session.id}/design-preferences`, designData);
      if (response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to save design preferences:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Generate AI content for the entire site
  const generateAIContent = useCallback(async () => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/wizard/${session.id}/generate-content`);
      return response.data;
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Get content generation status
  const getContentGenerationStatus = useCallback(async () => {
    if (!session?.id) return { status: 'idle', progress: 0 };

    try {
      const response = await apiClient.get(`/customer/wizard/${session.id}/content-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get content generation status:', error);
      return { status: 'error', progress: 0 };
    }
  }, [session?.id]);

  // Request specific AI content via admin queue
  const requestSpecificAIContent = useCallback(async (type: V2AiRequest['requestType'], requestData?: any) => {
    if (!session?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Prepare request for V2 Admin Queue API
      // Use customer wizard AI content generation endpoint
      const response = await apiClient.post(`/customer/wizard/${session.id}/generate-content`);
      
      if (response.data?.message) {
        const newRequest: V2AiRequest = {
          id: Date.now(), // Use timestamp as ID since customer endpoint doesn't return request ID
          status: 'pending',
          requestType: type,
          estimatedTime: response.data.estimatedTime || 300 // 5 minutes default
        };

        setAiRequests(prev => ({ ...prev, [type]: newRequest }));

        // Start polling for completion using session ID
        startPollingAiRequest(type, session.id);
      }
    } catch (error) {
      console.error('Failed to request AI content:', error);
      setError(error as Error);
      
      setAiRequests(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          status: 'failed',
          errorMessage: (error as Error).message
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Poll AI request status
  const startPollingAiRequest = useCallback((type: V2AiRequest['requestType'], sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/customer/wizard/${sessionId}/content-status`);
        
        if (response.data) {
          const { status, progress, content } = response.data;
          
          setAiRequests(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              status: status.toLowerCase(),
              generatedContent: content,
              progress
            }
          }));

          // Stop polling when completed or failed
          if (status === 'completed' || status === 'rejected' || status === 'failed') {
            clearInterval(pollInterval);
            
            // If completed, auto-apply content to session
            if (status === 'completed' && content) {
              applyAiContentToSession(type, content);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds

    // Store interval for cleanup
    return pollInterval;
  }, []);

  // Apply AI content to session
  const applyAiContentToSession = useCallback(async (type: V2AiRequest['requestType'], content: any) => {
    if (!session?.id) return;

    try {
      // Parse content if it's a string
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

      // Map AI content type to session data structure
      let updateData: any = {};
      
      switch (type) {
        case 'SERVICES':
          updateData.contentData = {
            ...session.contentData,
            services: parsedContent.services || parsedContent
          };
          break;
        case 'HERO':
          updateData.contentData = {
            ...session.contentData,
            hero: parsedContent
          };
          break;
        case 'ABOUT':
          updateData.contentData = {
            ...session.contentData,
            about: parsedContent
          };
          break;
        case 'TESTIMONIALS':
          updateData.contentData = {
            ...session.contentData,
            testimonials: parsedContent.testimonials || parsedContent
          };
          break;
        case 'FAQ':
          updateData.contentData = {
            ...session.contentData,
            faq: parsedContent.faq || parsedContent
          };
          break;
        case 'SEO':
          updateData.contentData = {
            ...session.contentData,
            seo: parsedContent
          };
          break;
      }

      // Update session with new content
      await updateSession(updateData);
    } catch (error) {
      console.error('Failed to apply AI content:', error);
    }
  }, [session, updateSession]);

  // Complete wizard and create site
  const completeWizard = useCallback(async (subdomain: string, deployImmediately = true) => {
    if (!session?.id) throw new Error('No active wizard session');

    try {
      setIsLoading(true);
      const response = await apiClient.post(`/customer/wizard/${session.id}/complete`, {
        subdomain,
        siteName: session.businessInfo?.siteName,
        deployImmediately
      });

      if (response.data) {
        // Clear stored session
        localStorage.removeItem('currentWizardSession');
        return response.data;
      } else {
        throw new Error('Failed to complete wizard');
      }
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Refresh current session
  const refreshSession = useCallback(async () => {
    if (session?.id) {
      await getSession(session.id);
    }
  }, [session?.id, getSession]);

  // Auto-load session on mount if stored
  useEffect(() => {
    const storedSessionId = localStorage.getItem('currentWizardSession');
    if (storedSessionId && !session) {
      getSession(storedSessionId);
    }
  }, [session, getSession]);

  // Cleanup polling intervals
  useEffect(() => {
    return () => {
      Object.values(aiRequests).forEach(request => {
        if ((request as any).pollInterval) {
          clearInterval((request as any).pollInterval);
        }
      });
    };
  }, [aiRequests]);

  const value: V2WizardContextType = {
    // Session management
    session,
    isLoading,
    error,

    // Session operations
    startWizard,
    getSession,
    updateSession,
    completeWizard,

    // Step management
    saveBusinessInfo,
    saveTemplateSelection,
    saveDesignPreferences,

    // AI Integration
    generateAIContent,
    getContentGenerationStatus,
    aiRequests,
    requestSpecificAIContent,

    // Utilities
    refreshSession
  };

  return (
    <V2WizardContext.Provider value={value}>
      {children}
    </V2WizardContext.Provider>
  );
}

export function useV2Wizard() {
  const context = useContext(V2WizardContext);
  if (context === undefined) {
    throw new Error('useV2Wizard must be used within a V2WizardProvider');
  }
  return context;
}