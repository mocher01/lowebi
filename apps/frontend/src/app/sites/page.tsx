'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import { useCustomerAuthStore } from '@/store/customer-auth-store';
import Link from 'next/link';
import ConfirmModal from '@/components/common/confirm-modal';

// Step name mapping for proper display
const getStepName = (wizardStep: number | string): string => {
  console.log('🔍 getStepName called with:', wizardStep, typeof wizardStep);

  // Convert to number if it's a string
  const stepNumber = typeof wizardStep === 'string' ? parseInt(wizardStep, 10) : wizardStep;
  console.log('🔍 stepNumber after conversion:', stepNumber);

  const stepNames = [
    'Bienvenue',      // 0
    'Modèle',         // 1
    'Informations',   // 2
    'Contenu',        // 3
    'Images',         // 4
    'Fonctionnalités', // 5
    'Révision & Création' // 6
  ];

  if (isNaN(stepNumber) || stepNumber < 0 || stepNumber >= stepNames.length) {
    const fallback = `UNKNOWN_STEP_${stepNumber}`;
    console.log('🔍 getStepName returning FALLBACK:', fallback);
    return fallback;
  }

  const result = stepNames[stepNumber];
  console.log('🔍 getStepName returning VALID STEP:', result);
  return result;
};

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

// Set up response interceptor for automatic token refresh
customerApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        // Get refresh token from cookie
        const refreshToken = typeof window !== 'undefined' ? 
          document.cookie
            .split('; ')
            .find(row => row.startsWith('customer_refresh_token='))
            ?.split('=')[1] : null;
            
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        console.log('🔄 Attempting token refresh...');
        const response = await axios.post('/customer/auth/refresh', {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update stored tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('customer_access_token', accessToken);
          document.cookie = `customer_refresh_token=${newRefreshToken}; path=/; httpOnly=false; secure=${process.env.NODE_ENV === 'production'}; samesite=strict; max-age=${7 * 24 * 60 * 60}`;
        }
        
        // Retry the original request
        original.headers.Authorization = `Bearer ${accessToken}`;
        return customerApiClient(original);
      } catch (refreshError) {
        console.log('❌ Token refresh failed, clearing auth');
        // Clear tokens and redirect handled by the calling code
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customer_access_token');
          document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
        // Throw a custom error that we can reliably detect
        const authError = new Error('AUTH_FAILED');
        (authError as any).isAuthError = true;
        return Promise.reject(authError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default function SitesPage() {
  const { user, logout } = useCustomerAuthStore();
  const router = useRouter();
  const [sites, setSites] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load wizard sessions from API
  useEffect(() => {
    const loadWizardSessions = async () => {
      try {
        console.log('🔄 Loading wizard sessions via authenticated API...');
        
        const response = await customerApiClient.get('/customer/wizard-sessions');
        const data = response.data;

        if (data.success && data.sessions) {
          // Use API response directly - no unnecessary transformation
          const cleanSites = data.sessions.map((session: any) => {
            const stepNumber = session.currentStep || 0; // Raw number for URL
            return {
              ...session,
              name: session.siteName, // Keep familiar property name
              domain: (!session.domain || session.domain === 'untitled.logen.app')
                ? 'Not assigned'
                : session.domain,
              status: `step-${session.currentStep + 1}`,
              lastUpdated: formatTimeAgo(session.lastUpdated),
              businessType: session.businessType || 'Unknown',
              currentStep: getStepName(stepNumber), // Display name
              currentStepNumber: stepNumber, // Raw number for Continue button URL
              sessionId: session.sessionId || session.id, // FALLBACK: use id if sessionId is null
              deploymentStatus: session.deploymentStatus || 'draft', // Add deployment status
              siteUrl: session.siteUrl, // Add site URL
            };
          });

          setSites(cleanSites);
          console.log('✅ Successfully loaded wizard sessions:', cleanSites.length);
        }
      } catch (error: any) {
        console.error('❌ Failed to load wizard sessions:', error);

        // Handle authentication errors - redirect immediately without clearing sites
        // Check for:
        // 1. Our custom auth error flag from interceptor
        // 2. 401 error
        // 3. Auth-related error messages
        // 4. Missing access token
        const is401Error = error.response?.status === 401;
        const isCustomAuthError = error.isAuthError === true || error.message === 'AUTH_FAILED';
        const isAuthMessageError = error.message?.includes('refresh token') ||
                                   error.message?.includes('No refresh token') ||
                                   error.message?.includes('Authentication');
        const hasNoToken = !localStorage.getItem('customer_access_token');

        if (is401Error || isCustomAuthError || isAuthMessageError || hasNoToken) {
          console.log('🚫 Authentication failed - redirecting to login immediately');
          console.log('Auth error details:', {
            is401Error,
            isCustomAuthError,
            isAuthMessageError,
            hasNoToken,
            errorMessage: error.message
          });
          // Clear any remaining tokens
          localStorage.removeItem('customer_access_token');
          document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          // Force immediate redirect to login page
          window.location.href = '/login';
          return;
        }

        // For other errors, clear the sites list
        setSites([]);
      }
    };


    loadWizardSessions();

    // Reload sessions every 5 minutes to reduce server load  
    const interval = setInterval(loadWizardSessions, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const updatedDate = new Date(date);
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return updatedDate.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    if (status.startsWith('step-')) {
      const stepNum = parseInt(status.split('-')[1]);
      if (stepNum <= 2) return 'bg-red-100 text-red-800';
      if (stepNum <= 4) return 'bg-yellow-100 text-yellow-800';
      if (stepNum <= 6) return 'bg-blue-100 text-blue-800';
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string, currentStep: string, progress: number) => {
    if (status.startsWith('step-')) {
      return `${progress}% - ${currentStep}`;
    }
    return 'Unknown';
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  // Handle delete button click - show confirmation modal
  const handleDeleteClick = (site: any) => {
    setSiteToDelete(site);
    setShowDeleteModal(true);
  };

  // Actually delete the session after confirmation
  const deleteSession = async () => {
    if (!siteToDelete) return;

    setIsDeleting(true);
    try {
      console.log(`🗑️ Deleting session: ${siteToDelete.sessionId}`);

      // Call authenticated DELETE endpoint
      await customerApiClient.delete(`/customer/wizard-sessions/${siteToDelete.sessionId}`);

      console.log(`✅ Session deleted successfully`);

      // Show success toast
      showToast(`Site "${siteToDelete.name}" deleted successfully`, 'success');

      // Remove from local state immediately for better UX
      setSites(prevSites => prevSites.filter(site => site.sessionId !== siteToDelete.sessionId));

      // Reset modal state
      setSiteToDelete(null);
    } catch (error: any) {
      console.error('❌ Error deleting session:', error);

      // Show error toast
      const errorMessage = error.response?.data?.message || 'Failed to delete site. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fixed items per page for consistent experience across browsers
  // Users can adjust this in future via a dropdown if needed

  // Pagination calculations
  const totalPages = Math.ceil(sites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSites = sites.slice(startIndex, endIndex);

  // Reset to page 1 when sites change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sites.length, totalPages, currentPage]);

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="p-6">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Sites & Projects</h1>
                <p className="mt-1 text-gray-600">
                  Continue working on your sites in creation and manage published sites
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/sites/create"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create New Site</span>
                </Link>
              </div>
            </div>

            {/* View Controls */}
            {sites.length > 0 && (
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {sites.length} project{sites.length > 1 ? 's' : ''} in progress
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-18 8h18m-18 4h18" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Sites Content - Table or Cards View */}
            {sites.length > 0 ? (
              viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Site
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Step
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedSites.map((site) => (
                          <tr
                            key={site.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
                                    <div className="h-6 w-6 bg-white rounded shadow-sm flex items-center justify-center">
                                      <div className="h-2 w-2 bg-gray-300 rounded"></div>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{site.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    {site.domain && site.domain !== 'Not assigned' ? (
                                      <>
                                        {site.domain.includes('logen.locod-ai.com') ? (
                                          <a
                                            href={`https://${site.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                            title="Visiter le site"
                                          >
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {site.domain}
                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        ) : (
                                          <a
                                            href={`https://${site.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                            title="Visiter le site"
                                          >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            {site.domain}
                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Pas de domaine</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-3" style={{width: '80px'}}>
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{width: `${site.progress}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900 font-medium">{site.progress}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {site.businessType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(site.status)}`}>
                                {site.currentStep}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {site.lastUpdated}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {site.deploymentStatus === 'deployed' ? (
                                  <button
                                    onClick={() => router.push(`/admin/sites/${site.id}`)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Manage
                                  </button>
                                ) : (
                                  <Link
                                    href={`/wizard?continue=${site.sessionId}&step=${site.currentStepNumber}`}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Continue
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleDeleteClick(site)}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedSites.map((site) => (
                    <div
                      key={site.id}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 mr-3">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
                                <div className="h-8 w-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                  <div className="h-3 w-3 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {site.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {site.businessType}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            site.progress > 80 
                              ? 'bg-green-100 text-green-800'
                              : site.progress > 50
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {site.progress}% done
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${site.progress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {site.currentStep}
                          </p>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {site.lastUpdated}
                          </span>
                          <div className="mt-2">
                            {site.domain && site.domain !== 'Not assigned' ? (
                              <>
                                {site.domain.includes('logen.locod-ai.com') ? (
                                  <a
                                    href={`https://${site.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    title="Visiter le site"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {site.domain}
                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ) : (
                                  <a
                                    href={`https://${site.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                    title="Visiter le site"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    {site.domain}
                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Pas de domaine assigné</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {site.deploymentStatus === 'deployed' ? (
                            <button
                              onClick={() => router.push(`/admin/sites/${site.id}`)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-center text-sm font-medium"
                            >
                              Manage
                            </button>
                          ) : (
                            <Link
                              href={`/wizard?continue=${site.sessionId}&step=${site.currentStepNumber}`}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-center text-sm font-medium"
                            >
                              Continue
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteClick(site)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9h9m-9 0l9-9m0 0L12 3m0 0l9 9" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No website projects yet</h3>
                <p className="mt-2 text-gray-500 max-w-md mx-auto">
                  Get started by creating your first website using our guided wizard. Choose from professional templates and customize with AI assistance.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {sites.length > 0 && totalPages > 1 && (
              <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Info Section - Stacks on mobile */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <span className="text-sm text-gray-700 whitespace-nowrap">
                      Affichage {startIndex + 1} à {Math.min(endIndex, sites.length)} sur {sites.length} projet{sites.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      ({itemsPerPage} par page)
                    </span>
                  </div>

                  {/* Pagination Buttons - Cross-browser optimized */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center min-w-[80px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        boxSizing: 'border-box',
                        lineHeight: '1.5'
                      }}
                    >
                      Premier
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center min-w-[100px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        boxSizing: 'border-box',
                        lineHeight: '1.5'
                      }}
                    >
                      ← Précédent
                    </button>
                    <span
                      className="inline-flex items-center justify-center min-w-[100px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg"
                      style={{
                        boxSizing: 'border-box',
                        lineHeight: '1.5',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center min-w-[90px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        boxSizing: 'border-box',
                        lineHeight: '1.5'
                      }}
                    >
                      Suivant →
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center min-w-[75px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        boxSizing: 'border-box',
                        lineHeight: '1.5'
                      }}
                    >
                      Dernier
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSiteToDelete(null);
          }}
          onConfirm={deleteSession}
          title="Delete Site?"
          message={`Are you sure you want to delete "${siteToDelete?.name}"? This action cannot be undone. The site files and Docker container will be permanently removed.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
        />

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.message}
          </div>
        )}
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}