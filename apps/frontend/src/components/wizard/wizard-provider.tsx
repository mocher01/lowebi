'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { apiClient, adminApiClient } from '@/lib/api-client';
import { useCustomerAuthStore } from '@/store/customer-auth-store';
import { throttleWizardUpdate } from '@/lib/throttle';
import axios from 'axios';

// Interval type for browser compatibility
type IntervalId = ReturnType<typeof setInterval>;

// Endpoint helper to ensure consistent API usage
function getSessionEndpoint(opts: {
  authenticated: boolean;
  sessionExists: boolean;
  sessionId: string | null;
  verb: 'create' | 'update' | 'get' | 'getOrCreate';
}) {
  const { authenticated, sessionExists, sessionId, verb } = opts;

  if (!sessionId) {
    throw new Error('sessionId is required for endpoint generation');
  }

  if (!authenticated) {
    if (verb === 'get') return { url: `/api/public/wizard-sessions/${sessionId}`, method: 'GET' };
    if (verb === 'create' || (!sessionExists && verb === 'update'))
      return { url: `/api/public/wizard-sessions/${sessionId}/create`, method: 'POST' };
    return { url: `/api/public/wizard-sessions/${sessionId}`, method: 'PUT' };
  }

  // authenticated
  if (verb === 'get') return { url: `/customer/wizard-sessions/${sessionId}`, method: 'GET' };
  if (verb === 'getOrCreate') return { url: `/customer/wizard-sessions/${sessionId}/get-or-create`, method: 'POST' };
  // For create/update we use same URL with different methods
  return {
    url: `/customer/wizard-sessions/${sessionId}`,
    method: sessionExists ? 'PUT' : 'POST'
  };
}

// Create customer API client with proper auth handling
const customerApiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 10000,
  withCredentials: true,
});

// Set up request interceptor to add auth token
customerApiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Module-level flag to prevent loadSession during OAuth (survives re-renders)
let oauthProcessingInProgress = false;
let oauthProcessingSessionId: string | null = null;

// Export function to set OAuth processing flag
export function setOAuthProcessing(sessionId: string, isProcessing: boolean) {
  oauthProcessingInProgress = isProcessing;
  oauthProcessingSessionId = sessionId;
  console.log(`🔒 OAuth processing flag set to: ${isProcessing} for session: ${sessionId}`);

  // Auto-clear after 10 seconds
  if (isProcessing) {
    setTimeout(() => {
      if (oauthProcessingSessionId === sessionId) {
        oauthProcessingInProgress = false;
        oauthProcessingSessionId = null;
        console.log('✅ OAuth processing flag auto-cleared');
      }
    }, 10000);
  }
}

// Types for wizard data
export interface WizardData {
  // Step 1: Welcome & Terms
  termsAccepted: boolean;
  siteLanguage: string;

  // Step 2: Template Selection
  selectedTemplate?: string;
  templateData?: any;

  // Step 3: Business Info
  siteName: string;
  businessType: string;
  businessDescription: string;
  domain: string;
  slogan: string;
  terminology: string;
  siteId: string;

  // V1 compatibility fields for AI requests
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };

  // Step 4: Images & Logo (V1 compatible)
  logoFile?: File;
  logoUrl?: string;
  logoFooterUrl?: string;
  faviconLightUrl?: string;
  faviconDarkUrl?: string;
  heroImageFile?: File;
  heroImageUrl?: string;
  serviceImages?: Array<{
    id: number;
    url: string;
    serviceIndex: number;
  }>;
  imageApproach: 'manual' | 'ai' | 'mixed';
  images: {
    logo?: string;
    logoFooter?: string;
    hero?: string;
    faviconLight?: string;
    faviconDark?: string;
    services?: string[];
    blog?: string[];
  };
  imageChoices?: {
    logo?: 'upload' | 'ai';
    logoFooter?: 'upload' | 'ai';
    hero?: 'upload' | 'ai';
    faviconLight?: 'upload' | 'ai';
    faviconDark?: 'upload' | 'ai';
    services?: ('upload' | 'ai')[];
    blog?: ('upload' | 'ai')[];
  };
  aiStyle: string;
  otherImagesChoice: 'upload' | 'ai';

  // Step 5: Content & Services (V1 compatible)
  services: Array<{
    id?: string;
    name: string;
    title: string;
    description: string;
    features: string[];
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
    hours?: string;
  };

  // V1 Complete Content Structure
  hero: {
    title: string;
    subtitle: string;
    description: string;
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    values: Array<{
      title: string;
      description: string;
    }>;
  };
  testimonials: Array<{
    text: string;
    name: string;
    position: string;
    rating: number;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  blog?: {
    articles: Array<{
      title: string;
      excerpt: string;
      content: string;
      category: string;
      tags: string[];
    }>;
  };

  // Step 6: Advanced Features (NEW - Phase 1-6)
  step6?: {
    emailConfig?: {
      scenario?: 'oauth2' | 'locodai-default' | 'no-form';

      // OAuth2 Gmail (Scenario A)
      oauth?: {
        connected: boolean;
        email: string;
        oauthCredentialId: string; // Reference to oauth2_credentials table
      };

      // Locod.ai default (Scenario B)
      locodaiDefault?: {
        enabled: boolean;
        businessEmail: string;
        gdprConsent: {
          accepted: boolean;
          acceptedAt: string;
          ipAddress: string;
          policyVersion: string;
        };
      };

      // No form (Scenario C)
      noForm?: {
        contactInfoOnly?: {
          phone?: string;
          address?: string;
          socialLinks?: string[];
        };
      };
    };

    // N8N Configuration (Phase 2 - TBD)
    n8n?: {
      enabled: boolean;
    };

    // Analytics Configuration (Phase 3 - TBD)
    analytics?: {
      enabled: boolean;
    };

    // reCAPTCHA Configuration (Phase 4 - TBD)
    recaptcha?: {
      enabled: boolean;
    };
  };

  // Step 7: Advanced Features (V1 compatible - OLD)
  enableBlog: boolean;
  enableNewsletter: boolean;
  integrations: {
    newsletter: {
      enabled: boolean;
      provider: string;
      hasGoogleAccount: boolean;
      gmailAddress: string;
      gmailAppPassword: string;
      apiKey: string;
    };
  };
  seoSettings: {
    title: string;
    description: string;
    keywords: string[];
  };

  // Step 8: Final Review
  reviewNotes?: string;

  // Legacy aliases for V1 compatibility
  heroContent: {
    title: string;
    subtitle: string;
    description: string;
  };
  aboutContent: {
    title: string;
    subtitle: string;
    description: string;
    values: Array<{
      title: string;
      description: string;
    }>;
  };
}

export interface AiRequest {
  id?: string; // Changed to string for consistency
  status: 'idle' | 'pending' | 'assigned' | 'processing' | 'completed' | 'rejected' | 'failed';
  requestType: 'services' | 'hero' | 'about' | 'testimonials' | 'faq' | 'seo' | 'images' | 'content';
  generatedContent?: any;
  generatedImages?: Record<string, string>; // V2.3: Images fetched from session storage
  errorMessage?: string;
  startTime?: number;
  elapsedTime?: string;
  pollIntervalId?: IntervalId; // Fixed type and naming
  timerIntervalId?: IntervalId; // Added for timer interval
  autoApply?: boolean; // BUG #5 FIX: Flag to trigger auto-application of completed content
}

interface WizardContextType {
  // State
  currentStep: number;
  wizardData: WizardData;
  aiRequests: Record<string, AiRequest>;
  isLoading: boolean;
  error: Error | null;
  sessionId: string | null;
  sessionResolved: boolean;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Data management
  updateWizardData: (data: Partial<WizardData>) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  
  // Clean session management
  createWizardSession: (data: WizardData) => Promise<void>;

  // AI Integration
  requestAiContent: (type: AiRequest['requestType'], requestData?: any) => Promise<void>;
  getAiRequestStatus: (type: AiRequest['requestType']) => AiRequest;
  applyAiContent: (type: AiRequest['requestType']) => void;

  // Site creation
  createSite: () => Promise<{ siteId: string; customerId: number }>;
  
  // Session management
  resetWizard: () => void;
  clearSessionId: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const initialWizardData: WizardData = {
  termsAccepted: false,
  siteLanguage: 'fr',
  siteName: '',
  businessType: '',
  businessDescription: '',
  domain: '',
  slogan: '',
  terminology: 'services',
  siteId: '',
  imageApproach: 'manual',
  images: {
    logo: undefined,
    logoFooter: undefined,
    hero: undefined,
    faviconLight: undefined,
    faviconDark: undefined,
    services: []
  },
  imageChoices: {
    logo: 'upload',
    logoFooter: 'upload',
    hero: 'upload',
    faviconLight: 'upload',
    faviconDark: 'upload'
  },
  aiStyle: 'modern',
  otherImagesChoice: 'upload',
  services: [],
  contact: {
    email: '',
    phone: '',
    address: '',
    hours: ''
  },
  hero: {
    title: '',
    subtitle: '',
    description: ''
  },
  about: {
    title: '',
    subtitle: '',
    description: '',
    values: []
  },
  testimonials: [],
  faq: [],
  blog: {
    articles: []
  },
  enableBlog: false,
  enableNewsletter: false,
  integrations: {
    newsletter: {
      enabled: false,
      provider: 'n8n',
      hasGoogleAccount: false,
      gmailAddress: '',
      gmailAppPassword: '',
      apiKey: ''
    }
  },
  seoSettings: {
    title: '',
    description: '',
    keywords: []
  },
  // Legacy aliases
  heroContent: {
    title: '',
    subtitle: '',
    description: ''
  },
  aboutContent: {
    title: '',
    subtitle: '',
    description: '',
    values: []
  }
};

export function WizardProvider({ children }: { children: React.ReactNode }) {
  // Centralized URL params parsing
  const urlFlags = useMemo(() => {
    if (typeof window === 'undefined') return { isNew: false, continueId: null as string | null, step: null as number | null };
    const p = new URLSearchParams(window.location.search);
    const s = p.get('step');
    return {
      isNew: p.get('new') === 'true',
      continueId: p.get('continue'),
      step: s !== null && s !== '' && !isNaN(parseInt(s)) ? Math.max(0, Math.min(6, parseInt(s))) : null
    };
  }, []);

  // Runtime guard to prevent duplicate session creation
  const createInFlight = useRef(false);
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check if this is a fresh start FIRST
      const urlParams = new URLSearchParams(window.location.search);
      const isNew = urlParams.get('new') === 'true';

      // Check if URL specifies a step (e.g., OAuth2 callback returns to step=6)
      const urlStep = urlParams.get('step');
      if (urlStep) {
        const stepNum = parseInt(urlStep, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 7) {
          return stepNum;
        }
      }

      if (isNew) {
        // Don't load from localStorage for fresh starts
        return 0;
      }

      const saved = localStorage.getItem('wizard-current-step');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    if (typeof window !== 'undefined') {
      // Check if this is a fresh start FIRST
      const urlParams = new URLSearchParams(window.location.search);
      const isNew = urlParams.get('new') === 'true';
      
      if (isNew) {
        // Don't load from localStorage for fresh starts
        return initialWizardData;
      }
      
      const saved = localStorage.getItem('wizard-data');
      return saved ? { ...initialWizardData, ...JSON.parse(saved) } : initialWizardData;
    }
    return initialWizardData;
  });
  const [aiRequests, setAiRequests] = useState<Record<string, AiRequest>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [initialSessionCreated, setInitialSessionCreated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Track session creation state - DYNAMIC to prevent duplication
  const [sessionExists, setSessionExists] = useState(false);
  const [initialContinueMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('continue') !== null;
    }
    return false;
  });

  // Get customer auth for API calls - needs to be early for dependency arrays
  const { user } = useCustomerAuthStore();

  // CRITICAL FIX: Start with unresolved sessionId and resolve reactively
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  // CRITICAL FIX: Resolve sessionId reactively based on URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sp = new URLSearchParams(window.location.search);
    const continueId = sp.get('continue');
    const isNew = sp.get('new') === 'true';

    console.log('🔄 REACTIVE SESSION RESOLUTION:', { continueId, isNew, currentSessionId: sessionId });

    // Decision order: continue > new > resume-from-LS > fallback
    if (continueId) {
      console.log('🔄 CONTINUE MODE: Using existing session ID from URL:', continueId);
      setSessionId(continueId);
      localStorage.setItem('wizard-session-id', continueId);
      setSessionExists(true); // we're continuing, not creating
      setSessionResolved(true);
      return;
    }

    if (isNew) {
      console.log('🆕 NEW SESSION MODE: Creating fresh session');
      // Clear localStorage for fresh start
      localStorage.removeItem('wizard-session-id');
      localStorage.removeItem('wizard-site-id');
      localStorage.removeItem('wizardProgress');
      localStorage.removeItem('wizard-data');
      localStorage.removeItem('wizard-current-step');
      localStorage.removeItem('currentWizardSession');

      const id = crypto.randomUUID();
      localStorage.setItem('wizard-session-id', id);
      setSessionId(id);
      setSessionExists(false);
      setSessionResolved(true);
      console.log('🆕 FRESH SESSION CREATED:', id);
      return;
    }

    const fromLS = localStorage.getItem('wizard-session-id');
    if (fromLS) {
      console.log('🔄 RESUME SESSION: From localStorage:', fromLS);
      setSessionId(fromLS);
      setSessionExists(true);
      setSessionResolved(true);
      return;
    }

    // Final fallback: create a new local id but DO NOT hit the API yet
    console.log('🆕 FALLBACK SESSION: Creating new local session');
    const id = crypto.randomUUID();
    localStorage.setItem('wizard-session-id', id);
    setSessionId(id);
    setSessionExists(false);
    setSessionResolved(true);
    console.log('🆕 FALLBACK SESSION CREATED:', id);
  }, []); // Run once on mount and when URL changes

  // Guarded session creation to prevent duplicates
  const guardedCreateSession = useCallback(async (payload: any, authenticated: boolean) => {
    if (!sessionResolved || !sessionId) return; // CRITICAL: Don't run until session is resolved
    if (createInFlight.current || sessionExists) return;
    createInFlight.current = true;
    try {
      const { url, method } = getSessionEndpoint({
        authenticated,
        sessionExists: false,
        sessionId,
        verb: 'create'
      });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('customer_access_token');
      if (authenticated && token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { method, headers, credentials: 'include', body: JSON.stringify(payload) });
      if (res.ok) {
        setSessionExists(true);
        console.log('✅ Guarded session creation successful');
      }
    } catch (error) {
      console.error('❌ Guarded session creation failed:', error);
    } finally {
      createInFlight.current = false;
    }
  }, [sessionResolved, sessionId, sessionExists]);

  // Load session data and determine if session exists
  useEffect(() => {
    // CRITICAL FIX: Don't load session if OAuth callback is in progress
    // Check module-level flag that persists across re-renders
    // Support gateKey: sessionId, 'global', or any custom key
    if (oauthProcessingInProgress && (
      oauthProcessingSessionId === sessionId ||
      oauthProcessingSessionId === 'global'
    )) {
      console.log('⏸️ Skipping loadSession - OAuth processing in progress (module flag)');
      setSessionExists(true);
      return;
    }

    // Also check URL params as backup
    const urlParams = new URLSearchParams(window.location.search);
    const oauth2Status = urlParams.get('oauth2Status') ?? urlParams.get('status') ?? urlParams.get('oauth_status');
    if (oauth2Status) {
      console.log('⏸️ Skipping loadSession - OAuth detected in URL');
      setSessionExists(true);
      // Set module flag with gateKey
      const gateKey = sessionId ?? 'global';
      setOAuthProcessing(gateKey, true);
      return;
    }

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/public/wizard-sessions/${sessionId}`, {
          method: 'GET',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.session) {
            console.log('✅ Session EXISTS:', sessionId);
            setSessionExists(true);

            if (result.session.data || result.session.wizardData) {
              const sessionData = result.session.data?.wizardData || result.session.wizardData || result.session.data;

              // Ensure siteId is present in loaded data
              if (sessionData && !sessionData.siteId && result.session.siteId) {
                sessionData.siteId = result.session.siteId;
                console.log('🆔 Added missing siteId to session data:', result.session.siteId);
              }

              // CRITICAL FIX: Merge with existing data instead of replacing
              // This prevents overwriting OAuth data that was just set
              setWizardData(prev => {
                const merged = { ...sessionData, ...prev };
                // But if session has step6, only merge if prev doesn't have it
                if (prev.step6 && !sessionData.step6) {
                  merged.step6 = prev.step6;
                  console.log('🔒 Preserved local step6 data during session load');
                }
                return merged;
              });

              // CRITICAL FIX: Respect URL step parameter if provided
              const urlParams = new URLSearchParams(window.location.search);
              const urlStep = urlParams.get('step');
              const targetStep = urlStep ? parseInt(urlStep, 10) : (result.session.currentStep || 0);
              console.log('🎯 Setting step to:', targetStep, '(URL:', urlStep, 'Session:', result.session.currentStep, ')');
              setCurrentStep(targetStep);

              // Store the siteId for session management
              if (sessionData?.siteId) {
                localStorage.setItem('wizard-site-id', sessionData.siteId);
              }
            }
          } else {
            console.log('🆕 Session does NOT exist, will CREATE:', sessionId);
            setSessionExists(false);
          }
        } else {
          console.log('🔧 DUPLICATION FIX: Session does NOT exist (HTTP error), will CREATE:', sessionId);
          setSessionExists(false);
        }
      } catch (error) {
        console.log('🔧 DUPLICATION FIX: Session check failed, will CREATE:', sessionId, error);
        setSessionExists(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Handle ?new=true parameter to force fresh session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isNewSession = urlParams.get('new') === 'true';
      
      if (isNewSession) {
        console.log('🆕 NEW SESSION FORCED by ?new=true parameter');
        
        // Clear ALL wizard-related localStorage to ensure completely fresh start
        const keysToRemove = [
          'wizard-session-id',
          'wizard-site-id', 
          'resume-wizard-session',
          'wizard-current-step',
          'wizard-data',
          'wizardProgress', // Critical: This persists step data after Quitter
          'last-wizard-session',
          'currentWizardSession'
        ];
        
        // Also clear any dynamic wizard-session-* entries
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.startsWith('wizard-session-')) {
            keysToRemove.push(key);
          }
        });
        
        // Remove all wizard data
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 Cleared localStorage: ${key}`);
        });
        
        // Generate completely fresh session and update state
        const newSessionId = crypto.randomUUID();
        console.log('🆕 COMPLETELY FRESH SESSION CREATED:', newSessionId);
        localStorage.setItem('wizard-session-id', newSessionId);
        setSessionId(newSessionId);
        
        // Reset all React state
        setCurrentStep(0);
        setWizardData(initialWizardData);
        setAiRequests({});
        setSessionExists(false);
        
        console.log('✅ Fresh session state reset complete');
      }
    }
  }, []); // Run only once on mount

  // API session management - FIXED FOR DUPLICATION ISSUE
  const updateWizardSession = useCallback(async (data: WizardData, stepOverride?: number) => {
    // Check if we have a site name (including default "New Site")
    if (!data.siteName) return; // Don't save until we have a site name

    try {
      const updateData = {
        siteName: data.siteName,
        siteId: data.siteId || '', // Will be generated from business name
        domain: data.domain || `${data.siteName.toLowerCase().replace(/\s+/g, '')}.logen.app`,
        currentStep: stepOverride !== undefined ? stepOverride : currentStep,
        businessType: data.businessType || 'Unknown',
        wizardData: { ...data, siteId: data.siteId || '' }, // Will be generated from business name
        aiRequests: aiRequests,
      };

      // DEBUG: Check if blog data is being sent
      if (data.blog?.articles) {
        console.log('🚀 Sending blog articles to backend:', data.blog.articles.length);
        console.log('🚀 Full blog data being sent:', data.blog);
      } else {
        console.log('⚠️ No blog articles in data being sent to backend');
      }

      // AUTH FIX: Choose endpoint based on authentication status  
      const isAuthenticated = !!user?.id;
      
      let endpoint: string;
      let method: string;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (user && user.id) {
        // Authenticated user - use proper create/update logic
        const token = localStorage.getItem('customer_access_token');
        if (sessionExists) {
          // Session exists - update it
          endpoint = `/customer/wizard-sessions/${sessionId}`;
          method = 'PUT';
          console.log(`🔐 AUTHENTICATED UPDATE: Using ${method} ${endpoint}`);
        } else {
          // New session - create it
          endpoint = `/customer/wizard-sessions/${sessionId}`;
          method = 'POST';
          console.log(`🔐 AUTHENTICATED CREATE: Using ${method} ${endpoint}`);
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        // Anonymous user - use public endpoints
        endpoint = `/api/public/wizard-sessions/${sessionId}/create`;
        method = 'POST';
        console.log(`👤 ANONYMOUS: Using ${method} ${endpoint}`);
      }
      
      console.log(`🔧 Using proper create/update logic based on sessionExists: ${sessionExists}`);

      const response = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        headers: headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`💾 ${method === 'POST' ? 'Created new' : 'Updated existing'} wizard session via API:`, result.session || result);
        
        // Mark session as existing after successful create
        if (method === 'POST' && !sessionExists) {
          console.log('🔧 Marking session as existing after successful CREATE');
          setSessionExists(true);
        }

        // Save session ID to localStorage for "My Wizards" page
        if (sessionId) {
          localStorage.setItem(`wizard-session-${sessionId}`, 'true');
          localStorage.setItem('last-wizard-session', sessionId);
        }
      } else {
        console.error('Failed to update wizard session:', response.status);
      }
    } catch (error) {
      console.error('Error updating wizard session:', error);
    }
  }, [currentStep, sessionId, aiRequests, sessionExists, user]);

  // Throttled version to prevent rate limiting
  const throttledUpdateWizardSession = useCallback(
    throttleWizardUpdate(updateWizardSession, 2000),
    [updateWizardSession]
  );

  // Helper function to update wizard session with explicit step - FIXED FOR DUPLICATION ISSUE
  const updateWizardSessionWithStep = useCallback(async (data: WizardData, step: number) => {
    if (!data.siteName) return; // Don't save until we have a site name
    
    try {
      const updateData = {
        siteName: data.siteName,
        siteId: data.siteId || '', // Will be generated from business name
        domain: data.domain || `${data.siteName.toLowerCase().replace(/\s+/g, '')}.logen.app`,
        currentStep: step, // Use the passed step value
        businessType: data.businessType || 'Unknown',
        wizardData: { ...data, siteId: data.siteId || '' }, // Will be generated from business name
        aiRequests: aiRequests,
      };

      // AUTH FIX: Choose endpoint based on authentication status  
      const isAuthenticated = !!user?.id;
      
      let endpoint: string;
      let method: string;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (isAuthenticated) {
        // Authenticated user - use proper create/update logic
        const token = localStorage.getItem('customer_access_token');
        if (sessionExists) {
          // Session exists - update it
          endpoint = `/customer/wizard-sessions/${sessionId}`;
          method = 'PUT';
          console.log(`🔐 STEP UPDATE (AUTH): Using ${method} ${endpoint} for step ${step}`);
        } else {
          // New session - create it
          endpoint = `/customer/wizard-sessions/${sessionId}`;
          method = 'POST';
          console.log(`🔐 STEP CREATE (AUTH): Using ${method} ${endpoint} for step ${step}`);
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        // Anonymous user - use public endpoints
        endpoint = `/api/public/wizard-sessions/${sessionId}/create`;
        method = 'POST';
        console.log(`👤 STEP UPDATE (ANON): Using ${method} ${endpoint} for step ${step}`);
      }

      const response = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        headers: headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`💾 ${method === 'POST' ? 'Created new' : 'Updated existing'} wizard session to step ${step}:`, result.session || result);
        
        // Mark session as existing after successful create
        if (method === 'POST' && !sessionExists) {
          console.log('🔧 Marking session as existing after step create');
          setSessionExists(true);
        }
        
        // Save session ID to localStorage for "My Wizards" page
        if (sessionId) {
          localStorage.setItem(`wizard-session-${sessionId}`, 'true');
          localStorage.setItem('last-wizard-session', sessionId);
        }
      } else {
        console.error('Failed to update wizard session:', response.status);
      }
    } catch (error) {
      console.error('Error updating wizard session:', error);
    }
  }, [sessionId, aiRequests, sessionExists, user]);

  // Throttled version to prevent rate limiting  
  const throttledUpdateWizardSessionWithStep = useCallback(
    throttleWizardUpdate(updateWizardSessionWithStep, 2000),
    [updateWizardSessionWithStep]
  );

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, 7);
      localStorage.setItem('wizard-current-step', newStep.toString());
      // Update session with new step - use immediate update for navigation
      setTimeout(() => updateWizardSession(wizardData, newStep), 100);
      return newStep;
    });
  }, [wizardData, updateWizardSession]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.max(prev - 1, 0);
      localStorage.setItem('wizard-current-step', newStep.toString());
      // Update session with new step - use immediate update for navigation
      setTimeout(() => updateWizardSession(wizardData, newStep), 100);
      return newStep;
    });
  }, [wizardData, updateWizardSession]);

  const goToStep = useCallback((step: number) => {
    const newStep = Math.max(0, Math.min(step, 7));
    setCurrentStep(newStep);
    localStorage.setItem('wizard-current-step', newStep.toString());
    // Update session with new step - use immediate update for navigation
    setTimeout(() => updateWizardSession(wizardData, newStep), 100);
  }, [wizardData, updateWizardSession]);

  // CREATE WIZARD SESSION - simple session creation
  const createWizardSession = useCallback(async (data: WizardData) => {
    console.log('📝 createWizardSession CALLED with siteName:', data.siteName);

    if (!data.siteName || data.siteName.trim().length === 0) {
      console.log('❌ createWizardSession: No siteName provided');
      return;
    }

    try {
      const updateData = {
        siteName: data.siteName,
        siteId: data.siteId || '', // Site ID should come from business-info-step
        domain: data.domain || `${data.siteName.toLowerCase().replace(/\s+/g, '')}.logen.app`,
        currentStep: currentStep,
        businessType: data.businessType || 'Unknown',
        wizardData: { ...data, siteId: data.siteId || '' },
        aiRequests: aiRequests,
      };

      // ALWAYS USE POST TO CREATE - no guessing about sessionExists
      const token = localStorage.getItem('customer_access_token');
      const endpoint = `/customer/wizard-sessions/${sessionId}`;
      const method = 'POST';

      console.log(`📝 CREATE SESSION: Using ${method} ${endpoint} for immediate session creation`);

      const response = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('💾 CREATED wizard session successfully:', result);

        // Mark session as existing after successful create
        setSessionExists(true);

        // Save session ID to localStorage
        if (sessionId) {
          localStorage.setItem(`wizard-session-${sessionId}`, 'true');
          localStorage.setItem('last-wizard-session', sessionId);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ CREATE SESSION FAILED:', response.status, errorText);

        // Parse error response and throw for caller to handle
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && errorData.message.includes('existe déjà')) {
            // Extract suggestion if available from backend error
            const suggestionMatch = errorData.message.match(/Veuillez utiliser "([^"]+)"/);
            throw new Error(JSON.stringify({
              type: 'DUPLICATE_SITE_NAME',
              message: errorData.message,
              suggestion: suggestionMatch ? suggestionMatch[1] : null
            }));
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('DUPLICATE_SITE_NAME')) {
            throw parseError; // Re-throw our custom error
          }
          // For other errors, throw generic error
          throw new Error(`Session creation failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('❌ CREATE SESSION ERROR:', error);
      throw error; // Re-throw so caller can handle it
    }
  }, [currentStep, sessionId, aiRequests, user]);

  // Data management
  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    console.log('🔄 updateWizardData called with:', {
      keys: Object.keys(data),
      siteName: data.siteName || 'no siteName',
      servicesUpdate: data.services?.length || 'no services',
      heroUpdate: data.heroContent?.title || 'no hero'
    });
    
    setWizardData(prev => {
      const newData = { ...prev, ...data };
      
      console.log('🔄 updateWizardData state update:', {
        previousSiteName: prev.siteName || 'empty',
        newSiteName: newData.siteName || 'empty',
        previousServices: prev.services?.length || 0,
        newServices: newData.services?.length || 0,
        previousHero: prev.heroContent?.title || 'empty',
        newHero: newData.heroContent?.title || 'empty'
      });
      
      // TRIGGER SESSION CREATION when siteName reaches meaningful length
      console.log('🔍 CHECKING SESSION CREATION CONDITION:', {
        hasSiteName: !!data.siteName,
        siteNameValue: data.siteName,
        siteNameLength: data.siteName ? data.siteName.trim().length : 0,
        conditionMet: data.siteName && data.siteName.trim().length >= 3
      });
      
      // CRITICAL FIX: Use guarded session creation with centralized continue check
      if (!sessionExists && data.siteName && data.siteName.trim().length >= 3 && !urlFlags.continueId) {
        const authenticated = !!user?.id;
        const payload = { ...newData, siteId: newData.siteId ?? '' };
        console.log('🔥 DETECTED MEANINGFUL SITENAME - USING GUARDED SESSION CREATION:', data.siteName);

        // Debounced guarded creation
        setTimeout(() => guardedCreateSession(payload, authenticated), 400);
      } else if (urlFlags.continueId) {
        console.log('🛑 DUPLICATION FIX: Skipping session creation - in continue mode for:', urlFlags.continueId);
      }
      
      localStorage.setItem('wizard-data', JSON.stringify(newData));
      
      // Update wizard sessions list - throttled to prevent rate limiting (preserve current step)
      throttledUpdateWizardSession(newData);
      
      return newData;
    });
  }, [throttledUpdateWizardSession, createWizardSession]);

  const saveProgress = useCallback(async () => {
    try {
      const progressData = {
        sessionId,
        currentStep,
        wizardData,
        timestamp: Date.now()
      };
      
      // Save to localStorage as backup
      localStorage.setItem('wizardProgress', JSON.stringify(progressData));
      // Also save the siteId separately for session management
      if (wizardData.siteId) {
        localStorage.setItem('wizard-site-id', wizardData.siteId);
      }
      
      // Save to backend API - CRITICAL FIX FOR DUPLICATION ISSUE
      try {
        const sessionData = {
          data: wizardData,
          currentStep,
          lastActiveAt: new Date().toISOString(),
          status: currentStep === 7 ? 'completed' : 'in_progress'
        };
        
        const fullSessionData = {
          siteName: wizardData.siteName || 'Untitled Site',
          siteId: wizardData.siteId || '', // Will be generated from business name
          businessType: wizardData.businessType || 'Unknown',
          domain: wizardData.domain || 'untitled.logen.app',
          currentStep,
          wizardData: { ...wizardData, siteId: wizardData.siteId || '' }, // Will be generated from business name
          data: wizardData,
          lastActiveAt: new Date().toISOString(),
          status: currentStep === 7 ? 'completed' : 'in_progress'
        };

        let response;

        console.log('🔧 SAVE PROGRESS - Session state check:');
        console.log(`🔧 Session ID: ${sessionId}`);
        console.log(`🔧 Session exists: ${sessionExists}`);
        console.log(`🔧 Initial continue mode: ${initialContinueMode}`);
        console.log(`🔧 User authenticated: ${!!user}`);
        console.log('🔧 WizardData step6:', JSON.stringify(wizardData.step6, null, 2));
        console.log('🔧 Full session data step6:', JSON.stringify(fullSessionData.wizardData.step6, null, 2));
        
        // DUPLICATION FIX: Use the correct logic to prevent duplicate creation
        if (sessionExists) {
          // SESSION EXISTS - Always update, never create
          console.log('🔧 DUPLICATION FIX: Session exists - updating (no new creation)');
          response = await fetch(`/api/public/wizard-sessions/${sessionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fullSessionData)
          });
        } else if (user) {
          // AUTHENTICATED USER CREATING NEW SESSION
          console.log('🔧 DUPLICATION FIX: Authenticated user creating new session (session does not exist)');
          const token = localStorage.getItem('customer_access_token');
          response = await fetch(`/customer/wizard-sessions/${sessionId}/get-or-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sessionData)
          });
          
          // Mark session as existing after creation
          if (response.ok) {
            setSessionExists(true);
          }
        } else {
          // ANONYMOUS USER CREATING NEW SESSION
          console.log('🔧 DUPLICATION FIX: Anonymous user creating new session (session does not exist)');
          response = await fetch(`/api/public/wizard-sessions/${sessionId}/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fullSessionData)
          });
          
          // Mark session as existing after creation
          if (response.ok) {
            setSessionExists(true);
          }
        }
        
        if (response.ok) {
          const result = await response.json();
          const action = sessionExists ? 'updated' : 'created';
          console.log(`💾 Wizard session ${action} successfully`);
        } else {
          console.warn('Failed to save to backend:', response.status);
          const errorText = await response.text();
          console.warn('Error details:', errorText);
        }
      } catch (apiError) {
        console.warn('Failed to save to backend API, using localStorage only:', apiError);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [sessionId, currentStep, wizardData, user, sessionExists]);

  const loadProgress = useCallback(async () => {
    try {
      // Try to load from backend API - both authenticated and anonymous
      try {
        let response;
        if (user) {
          // Authenticated user - use private endpoint
          const token = localStorage.getItem('customer_access_token');
          response = await fetch(`/customer/wizard-sessions/${sessionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else {
          // Anonymous user - use public endpoint  
          response = await fetch(`/api/public/wizard-sessions/${sessionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.session?.data) {
            setWizardData(result.session.data);
            setCurrentStep(result.session.currentStep || 0);
            console.log(`📥 Wizard session loaded from backend (${user ? 'authenticated' : 'anonymous'})`);
            return;
          }
        } else {
          console.log(`No existing ${user ? 'authenticated' : 'anonymous'} session found for: ${sessionId}`);
        }
      } catch (apiError) {
        console.warn('Failed to load from backend API, trying localStorage:', apiError);
      }
      
      // Fall back to localStorage
      const saved = localStorage.getItem('wizardProgress');
      if (saved) {
        const progressData = JSON.parse(saved);
        if (progressData.wizardData) {
          setWizardData(progressData.wizardData);
          setCurrentStep(progressData.currentStep || 0);
          console.log('📥 Wizard session loaded from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, [sessionId, user]);

  // V1 helper functions
  const generateCustomerId = useCallback(() => {
    // V1 generates a consistent ID for the session
    return sessionId || 'anonymous';
  }, [sessionId]);

  // Site ID generation moved to business-info-step.tsx where it belongs

  // Site ID generation is now handled by business-info-step when user enters business name
  // No automatic generation needed here

  // Expose functions to global window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).wizardContext = {
        createWizardSession: createWizardSession,
        wizardData,
        sessionId
      };
    }
  }, [createWizardSession, wizardData, sessionId]);


  const formatElapsedTime = useCallback((startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // New polling function for authenticated wizard session AI requests
  const startPollingWizardAiRequestStatus = useCallback((type: AiRequest['requestType'], requestId: string, sessionId: string) => {
    // Start timer that updates elapsed time every second
    const timerIntervalId = setInterval(() => {
      setAiRequests(prev => {
        const request = prev[type];
        if (request?.startTime) {
          return {
            ...prev,
            [type]: {
              ...request,
              elapsedTime: formatElapsedTime(request.startTime)
            }
          };
        }
        return prev;
      });
    }, 1000); // Update timer every second

    const pollIntervalId = setInterval(async () => {
      try {
        const token = localStorage.getItem('customer_access_token');
        const statusResponse = await fetch(
          `/customer/wizard-sessions/${sessionId}/ai-request/${requestId}/status`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          }
        );
        
        if (statusResponse.ok) {
          const result = await statusResponse.json();
          console.log('📊 Wizard AI request status:', result);
          
          const status = result.status;
          
          // Update status
          setAiRequests(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              status: status,
              elapsedTime: prev[type]?.startTime ? formatElapsedTime(prev[type].startTime) : '00:00'
            }
          }));

          // If completed, apply the generated content
          if (status === 'completed') {
            console.log('🎉 Wizard AI request completed!');

            // V2.3: If this is an image request, fetch session images
            if (type === 'images') {
              console.log('📸 Fetching session images after AI completion...');
              try {
                const imagesResponse = await fetch(
                  `/customer/wizard-sessions/${sessionId}/images`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                    credentials: 'include',
                  }
                );

                if (imagesResponse.ok) {
                  const imagesResult = await imagesResponse.json();
                  console.log(`✅ Session images fetched: ${Object.keys(imagesResult.images || {}).length} images`);
                  console.log('📋 Image keys:', Object.keys(imagesResult.images || {}));
                  console.log('🔍 Full images object:', imagesResult.images);

                  // Store images in the generatedContent for applyAiContent to use
                  setAiRequests(prev => ({
                    ...prev,
                    [type]: {
                      ...prev[type],
                      status: 'completed',
                      generatedContent: result.generatedContent,
                      generatedImages: imagesResult.images, // V2.3: Add images from session
                      autoApply: true
                    }
                  }));
                } else {
                  console.warn('⚠️ Failed to fetch session images');
                  setAiRequests(prev => ({
                    ...prev,
                    [type]: {
                      ...prev[type],
                      status: 'completed',
                      generatedContent: result.generatedContent,
                      autoApply: true
                    }
                  }));
                }
              } catch (error) {
                console.error('❌ Error fetching session images:', error);
                setAiRequests(prev => ({
                  ...prev,
                  [type]: {
                    ...prev[type],
                    status: 'completed',
                    generatedContent: result.generatedContent,
                    autoApply: true
                  }
                }));
              }
            } else {
              // For non-image requests, just apply the content
              setAiRequests(prev => ({
                ...prev,
                [type]: {
                  ...prev[type],
                  status: 'completed',
                  generatedContent: result.generatedContent,
                  autoApply: true
                }
              }));
            }

            clearInterval(pollIntervalId);
            clearInterval(timerIntervalId);
          } else if (status === 'rejected' || status === 'failed') {
            console.warn('❌ Wizard AI request rejected or failed');
            clearInterval(pollIntervalId);
            clearInterval(timerIntervalId);
          }
        }
      } catch (error) {
        console.error('Wizard AI polling error:', error);
        // Don't clear interval on error - retry
      }
    }, 3000); // Poll every 3 seconds
  }, [formatElapsedTime]);

  // AI Integration functions - V1 EXACT APPROACH
  const requestAiContent = useCallback(async (type: AiRequest['requestType'], requestData?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine endpoint and method based on authentication
      let endpoint: string;
      let method: string;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Prepare payload based on authentication
      let requestPayload: any;
      
      // Use proper authenticated wizard AI request endpoint
      endpoint = `/customer/wizard-sessions/${sessionId}/ai-request`;
      method = 'POST';
      
      // Add authentication header
      const token = localStorage.getItem('customer_access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use wizard-specific API format
      requestPayload = {
        requestType: type, // 'content' or 'images'
        wizardData: {
          siteName: wizardData.siteName,
          businessType: wizardData.businessType,
          domain: wizardData.domain,
          slogan: wizardData.slogan,
          businessDescription: wizardData.businessDescription,
          colors: wizardData.colors,
          services: wizardData.services,
          contact: wizardData.contact,
          terminology: wizardData.terminology || 'services',
          blog: wizardData.blog // CRITICAL: Include blog data for image generation
        },
        // Merge additional request data if provided (for image-specific data)
        ...(requestData && { ...requestData })
      };

      console.log('🤖 AI request payload:', requestPayload);

      const response = await fetch(endpoint, {
        method: method,
        credentials: 'include',
        headers: headers,
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI request created:', result);

        // Handle different response formats
        const requestId = result.requestId || result.id;
        const status = result.status || 'pending';

        const newAiRequest: AiRequest = {
          id: requestId,
          status: status,
          requestType: type,
          startTime: Date.now(),
          elapsedTime: '00:00'
        };

        // Store request with its actual type
        setAiRequests(prev => ({ ...prev, [type]: newAiRequest }));

        // Start polling with authenticated wizard endpoint (authentication required)
        if (!user || !user.id) {
          throw new Error('Authentication required for AI requests');
        }
        if (!sessionId) {
          throw new Error('Session ID required for AI requests');
        }
        startPollingWizardAiRequestStatus(type, requestId, sessionId);

        return Promise.resolve();
      } else {
        const errorText = await response.text();
        console.error('AI request failed:', response.status, errorText);
        throw new Error(`Failed to create AI request: ${response.status}`);
      }
    } catch (error) {
      console.error('AI request error:', error);
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
  }, [wizardData, sessionId, user, startPollingWizardAiRequestStatus]);

  const applyAiContent = useCallback(async (type: AiRequest['requestType']) => {
    // Get the request for the specific type
    const request = aiRequests[type];
    console.log('🤖 applyAiContent called:', { type, request: !!request, hasContent: !!request?.generatedContent });

    if (!request?.generatedContent) {
      console.warn('❌ No generated content found');
      return false;
    }

    let content: any;
    try {
      content = typeof request.generatedContent === 'string'
        ? JSON.parse(request.generatedContent)
        : request.generatedContent;
    } catch (e) {
      console.error('Invalid generatedContent', e);
      return false;
    }

    const updates: Partial<WizardData> = {};

    if (content.services) {
      updates.services = content.services.map((s: any) => ({
        title: s.title ?? '',
        name: s.title ?? '',
        description: s.description ?? '',
        features: Array.isArray(s.features) ? s.features : [],
      }));
    }
    if (content.hero) {
      console.log('🔍 DEBUG: AI hero content structure:', content.hero);
      // Only update hero content if it's actually content (not an image object)
      // Image objects have 'data' or 'filename' fields, content has 'title'/'subtitle'/'description'
      const isImageObject = content.hero.data || content.hero.filename;
      const isContentObject = content.hero.title || content.hero.mainTitle || content.hero.subtitle || content.hero.description;

      if (isContentObject && !isImageObject) {
        updates.hero = {
          title: content.hero.title || content.hero.mainTitle || '',
          subtitle: content.hero.subtitle || content.hero.subTitle || '',
          description: content.hero.description || content.hero.desc || ''
        };
        updates.heroContent = updates.hero; // keep legacy alias in sync
        console.log('🔍 DEBUG: Mapped hero for Principal tab:', updates.hero);
      } else {
        console.log('🔍 DEBUG: Skipping hero content update - this is an image object, not content');
      }
    }
    if (content.about) {
      updates.about = content.about;
      updates.aboutContent = content.about;
    }

    if (content.testimonials) updates.testimonials = content.testimonials;
    if (content.faq) updates.faq = content.faq;
    if (content.blog) updates.blog = content.blog;
    if (content.seo) updates.seoSettings = content.seo;

    // V2.3: Apply generated images if available
    if (request.generatedImages) {
      console.log(`📸 Applying ${Object.keys(request.generatedImages).length} generated images`);
      console.log('📋 Image keys to apply:', Object.keys(request.generatedImages));
      console.log('🔍 Before merge - wizardData.images keys:', Object.keys(wizardData.images || {}));
      console.log('🔍 Before merge - wizardData.images:', wizardData.images);
      updates.images = {
        ...wizardData.images,
        ...request.generatedImages
      };
      console.log('✅ After merge - updates.images keys:', Object.keys(updates.images || {}));
      console.log('✅ After merge - updates.images:', updates.images);
    }

    // 1) Optimistic local update
    const nextData = { ...wizardData, ...updates };
    setWizardData(nextData);

    // 2) Persist so a future reload matches what you see
    try {
      await updateWizardData(nextData);
      return true;
    } catch (e) {
      console.error('Persist failed', e);
      return false;
    }
  }, [aiRequests, updateWizardData, setWizardData]);

  // 🔧 BUG #5 FIX: Auto-apply AI content when polling detects completion
  useEffect(() => {
    Object.entries(aiRequests).forEach(async ([type, request]) => {
      if (request?.autoApply && request?.status === 'completed' && request?.generatedContent) {
        console.log('🤖 Auto-applying AI content for type:', type);
        const success = await applyAiContent(type as AiRequest['requestType']);

        // Clear the autoApply flag to prevent re-applying
        setAiRequests(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            autoApply: false
          }
        }));

        if (success) {
          console.log('✅ AI content applied and persisted successfully');
        }
      }
    });
  }, [aiRequests, applyAiContent]);

  const getAiRequestStatus = useCallback((type: AiRequest['requestType']) => {
    return aiRequests[type] || { status: 'idle', requestType: type };
  }, [aiRequests]);

  const createSite = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare site creation request for V2 Customer API
      const createSiteRequest = {
        name: wizardData.siteName || `Site-${Date.now()}`,
        description: `Professional ${wizardData.businessType} website`,
        subdomain: (wizardData.siteName || 'site').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        configuration: {
          branding: {
            siteName: wizardData.siteName,
            slogan: wizardData.slogan,
            logoUrl: wizardData.logoUrl
          },
          seo: wizardData.seoSettings,
          features: {
            blog: wizardData.enableBlog,
            newsletter: wizardData.enableNewsletter
          },
          businessType: wizardData.businessType,
          domain: wizardData.domain,
          contact: wizardData.contact
        },
        content: {
          hero: wizardData.heroContent,
          about: wizardData.aboutContent,
          services: wizardData.services,
          testimonials: wizardData.testimonials,
          faq: wizardData.faq
        }
      };

      // Create site using V2 Customer API
      const response = await apiClient.post('/customer/sites', createSiteRequest);
      
      if (response.data?.siteId) {
        return {
          siteId: response.data.siteId,
          customerId: response.data.customerId
        };
      } else {
        throw new Error('Failed to create site');
      }
    } catch (error) {
      console.error('Site creation error:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wizardData, sessionId]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Load progress on mount (unless starting fresh)
  useEffect(() => {
    // Check URL parameters for special modes
    const urlParams = new URLSearchParams(window.location.search);
    const isNew = urlParams.get('new') === 'true';
    const editSiteId = urlParams.get('edit');
    const continueSiteId = urlParams.get('continue');
    const stepParam = urlParams.get('step');
    const oauth2Status = urlParams.get('oauth2Status'); // OAuth2 callback detection
    const urlSessionId = urlParams.get('sessionId'); // OAuth2 callback uses sessionId param

    if (isNew) {
      // Clear previous wizard state for fresh start
      localStorage.removeItem('wizardProgress');
      localStorage.removeItem('wizard-data');
      localStorage.removeItem('wizard-current-step');
      localStorage.removeItem('currentWizardSession'); // Clear V2 wizard session too

      // Reset React state to initial values
      setCurrentStep(0);
      setWizardData(initialWizardData);
      setAiRequests({});

      console.log('Starting fresh wizard session - cleared all state');

      // CRITICAL FIX: Create backend session immediately for new wizard
      // This ensures the session appears in My Sites even if user quits early
      const initialData = {
        ...initialWizardData,
        siteName: '', // Empty by default - user will provide name
        siteId: '', // Will be generated async
      };
      setWizardData(initialData);

      // Site ID will be generated when user enters business name
      console.log('Fresh session created - siteId will be generated from business name');
    } else if (editSiteId) {
      // Edit mode - load site data for editing
      console.log('Loading site for editing:', editSiteId);
      // TODO: Load site data from API
      localStorage.removeItem('wizardProgress');
      localStorage.removeItem('wizard-data');
      localStorage.removeItem('wizard-current-step');
      localStorage.removeItem('currentWizardSession');
      console.log('Edit mode: cleared localStorage and will load site data');
    } else if (oauth2Status && urlSessionId && stepParam) {
      // OAuth2 callback - treat like continue mode with targetStep
      console.log('🔐 OAuth2 callback detected for session:', urlSessionId, 'at step:', stepParam, 'status:', oauth2Status);

      // Parse target step
      let targetStep = 0;
      if (stepParam !== null && stepParam !== undefined && stepParam !== '') {
        const parsedStep = parseInt(stepParam);
        if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 6) {
          targetStep = parsedStep;
        }
      }

      console.log('🎯 OAuth2 callback: Using targetStep:', targetStep);

      // Load session data from API with target step
      loadWizardSession(urlSessionId, targetStep);
    } else if (continueSiteId) {
      // Continue wizard from specific step
      console.log('Continuing wizard for session:', continueSiteId, 'at step:', stepParam);
      console.log('🔧 FIX: Using sessionId state instead of continueSiteId:', sessionId);
      console.log('🚨 DEBUG: sessionId state is:', sessionId, '| continueSiteId from URL:', continueSiteId);

      // CRITICAL FIX: Properly parse step parameter, handle "0" correctly
      let targetStep = 0;
      if (stepParam !== null && stepParam !== undefined && stepParam !== '') {
        const parsedStep = parseInt(stepParam);
        if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 6) {
          targetStep = parsedStep;
        }
      }

      console.log('🎯 Parsed target step:', targetStep, 'from stepParam:', stepParam);

      // Clear localStorage to prevent conflicts
      localStorage.removeItem('wizardProgress');
      localStorage.removeItem('wizard-data');
      localStorage.removeItem('wizard-current-step');
      localStorage.removeItem('currentWizardSession');

      // Load session data from API using the continueSiteId from URL (not sessionId state which might be stale)
      console.log('🚨 CRITICAL: Using continueSiteId from URL for API call:', continueSiteId, 'not sessionId state:', sessionId);
      loadWizardSession(continueSiteId, targetStep);
    } else {
      // Load previous progress
      loadProgress();
    }
  }, []); // 🚨 CRITICAL FIX: Empty dependency array prevents re-running and overriding continue step

  // Create initial backend session for new wizard
  useEffect(() => {
    // CRITICAL FIX: Guard with sessionResolved - sessionId may be null in continue mode temporarily
    if (!sessionResolved) return; // Don't run until session is resolved

    if (urlFlags.isNew && !urlFlags.continueId && !initialSessionCreated && !sessionExists) {
      const authenticated = !!user?.id;
      const payload = { ...wizardData, siteId: wizardData.siteId ?? '' };

      // Delay to ensure everything is initialized
      const timer = setTimeout(() => {
        console.log('🔍 Creating initial backend session for new wizard...');
        setInitialSessionCreated(true);
        guardedCreateSession(payload, authenticated);
      }, 500);

      return () => clearTimeout(timer);
    } else if (urlFlags.continueId) {
      console.log('🛑 DUPLICATION FIX: Skipping session creation - in continue mode for:', urlFlags.continueId);
      setInitialSessionCreated(true); // Mark as initialized to prevent further attempts
    }
  }, [sessionResolved, sessionId, urlFlags.isNew, urlFlags.continueId, initialSessionCreated, sessionExists, wizardData, guardedCreateSession, user?.id]);

  // Load wizard session from API
  const loadWizardSession = useCallback(async (sessionId: string, targetStep?: number) => {
    // CRITICAL FIX: Skip if OAuth is processing
    // Support gateKey: sessionId, 'global', or any custom key
    if (oauthProcessingInProgress && (
      oauthProcessingSessionId === sessionId ||
      oauthProcessingSessionId === 'global'
    )) {
      console.log('⏸️ Skipping loadWizardSession - OAuth processing in progress');
      return;
    }

    try {
      // Use authenticated customer API client for continue button functionality
      const response = await customerApiClient.get(`/customer/wizard-sessions/${sessionId}`);

      if (response.data.success && response.data.session) {
        const session = response.data.session;

        // CRITICAL FIX: Determine correct step to use
        let finalStep = session.currentStep || 0;
        if (targetStep !== undefined && targetStep !== null) {
          finalStep = targetStep;
          console.log('🎯 Using targetStep from URL:', targetStep, 'instead of session step:', session.currentStep);
        } else {
          console.log('📍 Using session step:', session.currentStep);
        }

        // Load wizard data from session
        setWizardData(session.wizardData || initialWizardData);
        setCurrentStep(finalStep);
        setAiRequests(session.aiRequests || {});

        // CRITICAL FIX: Mark session as existing when loading in continue mode
        setSessionExists(true);
        console.log('🛑 DUPLICATION FIX: Marked session as existing after loadWizardSession');

        console.log(`🔄 Loaded wizard session: ${sessionId}, final step: ${finalStep} (session: ${session.currentStep}, target: ${targetStep})`);
        console.log('🚨 DEBUG: About to call setCurrentStep with:', finalStep);

        // Add a delay to see if there's a race condition
        setTimeout(() => {
          console.log('🚨 DEBUG: Current step after timeout:', currentStep);
        }, 1000);
      } else {
        console.error('Failed to load wizard session:', response.status);
      }
    } catch (error) {
      console.error('Error loading wizard session:', error);
    }
  }, []);

  // Cleanup AI polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(aiRequests).forEach(request => {
        if (request.pollIntervalId) {
          clearInterval(request.pollIntervalId);
        }
        if (request.timerIntervalId) {
          clearInterval(request.timerIntervalId);
        }
      });
    };
  }, [aiRequests]);

  const value: WizardContextType = {
    // State
    currentStep,
    wizardData,
    aiRequests,
    isLoading,
    error,
    sessionId,
    sessionResolved,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Data management
    updateWizardData,
    saveProgress,
    loadProgress,
    
    // Clean session management 
    createWizardSession: createWizardSession,

    // AI Integration
    requestAiContent,
    getAiRequestStatus,
    applyAiContent,

    // Site creation
    createSite,

    // Session management
    resetWizard: () => {
      setCurrentStep(0);
      setWizardData(initialWizardData);
      localStorage.removeItem('wizard-current-step');
      localStorage.removeItem('wizard-data');
      localStorage.removeItem('wizard-session-id'); // Clear stored sessionId
    },
    
    // Session cleanup - clear stored sessionId to allow new session creation
    clearSessionId: () => {
      console.log('🧹 Clearing stored sessionId to prevent duplication');
      localStorage.removeItem('wizard-session-id');
    }
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}