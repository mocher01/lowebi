'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import SitePreview from '@/components/admin/site-preview';
import QuickActions from '@/components/admin/quick-actions';
import LogsModal from '@/components/admin/logs-modal';
import ContentTab from '@/components/admin/content-tab';
import axios from 'axios';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

// Force client-side rendering only - no SSR
export const dynamic = 'force-dynamic';

// Create customer API client with proper auth handling (same as MySites page)
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
        // Clear tokens and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customer_access_token');
          document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

interface SiteData {
  id: string;
  siteName: string;
  domain: string;
  deploymentStatus: string;
  lastDeployedAt: string | null;
  siteUrl: string | null;
  errorMessage: string | null;
  currentStep: number;
  progress: number;
  businessType: string;
  lastUpdated: string;
}

export default function SiteAdminPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't do anything until mounted on client
    if (!isMounted) return;

    const fetchSiteData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching site data for ID:', siteId);

        // Use wizard-sessions endpoint to get the actual site data
        const response = await customerApiClient.get(`/customer/wizard-sessions/${siteId}`);

        console.log('✅ Site data response:', response.data);

        if (response.data.success && response.data.session) {
          // Transform wizard session data to match SiteData interface
          const session = response.data.session;

          // Construct siteUrl from domain if available
          let siteUrl = session.siteUrl || null;
          if (!siteUrl && session.domain && session.deploymentStatus === 'deployed') {
            // If domain doesn't have protocol, add https://
            siteUrl = session.domain.startsWith('http') ? session.domain : `https://${session.domain}`;
          }

          const siteData: SiteData = {
            id: session.id,
            siteName: session.siteName || 'Untitled Site',
            domain: session.domain || 'Not assigned',
            deploymentStatus: session.deploymentStatus || 'draft',
            lastDeployedAt: session.lastDeployedAt || null,
            siteUrl,
            errorMessage: session.errorMessage || null,
            currentStep: session.currentStep || 0,
            progress: session.progress || 0,
            businessType: session.businessType || 'Unknown',
            lastUpdated: session.lastUpdated || session.updatedAt || new Date().toISOString(),
          };
          setSite(siteData);
        } else {
          setError('Site not found');
        }
      } catch (err: any) {
        console.error('❌ Error fetching site:', err);
        if (err.response?.status === 404) {
          setError('Site not found');
        } else if (err.response?.status === 401) {
          // Auth interceptor will handle redirect
          console.log('🚫 Authentication required');
        } else {
          setError(err.response?.data?.message || 'Failed to load site data');
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch data directly - auth is handled by axios interceptor
    if (siteId) {
      fetchSiteData();
    }
  }, [siteId, isMounted]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'text-green-700 bg-green-100';
      case 'deploying':
        return 'text-blue-700 bg-blue-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5" />;
      case 'deploying':
        return <Clock className="w-5 h-5 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const handleSiteDeleted = () => {
    router.push('/sites');
  };

  if (loading) {
    return (
      <CustomerProtectedRoute>
        <CustomerLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading site...</p>
            </div>
          </div>
        </CustomerLayout>
      </CustomerProtectedRoute>
    );
  }

  if (error || !site) {
    return (
      <CustomerProtectedRoute>
        <CustomerLayout>
          <div className="container mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-700 mb-4">{error || 'Site not found'}</p>
              <Link
                href="/sites"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Sites
              </Link>
            </div>
          </div>
        </CustomerLayout>
      </CustomerProtectedRoute>
    );
  }

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
      <div className="container mx-auto p-6 max-w-7xl">
          <div className="mb-6">
            <Link
              href="/sites"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Sites
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{site.siteName}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Business Type:</span>
                      {site.businessType}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Progress:</span>
                      {site.progress}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ' + getStatusColor(site.deploymentStatus)}>
                    {getStatusIcon(site.deploymentStatus)}
                    <span className="capitalize">{site.deploymentStatus}</span>
                  </div>
                  {site.lastDeployedAt && (
                    <span className="text-xs text-gray-500">
                      Last deployed: {formatDate(site.lastDeployedAt)}
                    </span>
                  )}
                </div>
              </div>

              {site.domain && site.domain !== 'Not assigned' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Domain:</span>
                    {site.siteUrl ? (
                      <a
                        href={site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {site.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-gray-600">{site.domain}</span>
                    )}
                  </div>
                </div>
              )}

              {site.errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Error:</span> {site.errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <QuickActions
              siteId={site.id}
              siteName={site.siteName}
              onViewLogs={() => setShowLogsModal(true)}
              onSiteDeleted={handleSiteDeleted}
            />
          </div>

          {site.deploymentStatus === 'deployed' && (
            <div className="mb-6">
              <ContentTab siteId={site.id} siteName={site.siteName} />
            </div>
          )}

          {site.siteUrl && site.deploymentStatus === 'deployed' && (
            <div className="mb-6">
              <SitePreview siteUrl={site.siteUrl} siteName={site.siteName} />
            </div>
          )}

          {!site.siteUrl && site.deploymentStatus === 'deployed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                This site is marked as deployed but no URL is available yet.
              </p>
            </div>
          )}

          {site.deploymentStatus !== 'deployed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800 mb-4">
                This site is not yet deployed. Complete the wizard to deploy your site.
              </p>
              <Link
                href={'/wizard?continue=' + site.id + '&step=' + site.currentStep}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue in Wizard
              </Link>
            </div>
          )}
        </div>

        <LogsModal
          isOpen={showLogsModal}
          onClose={() => setShowLogsModal(false)}
          siteId={site.id}
          siteName={site.siteName}
        />
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}
