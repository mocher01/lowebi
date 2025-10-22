'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'customer')[];
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  roles, 
  requireAdmin = false,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const performAuthCheck = async () => {
      try {
        await checkAuth();
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (retryCount < 2) {
          // Retry auth check up to 2 times
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
        } else {
          setAuthChecked(true);
        }
      }
    };

    if (!authChecked) {
      performAuthCheck();
    }
  }, [checkAuth, authChecked, retryCount]);

  useEffect(() => {
    if (!authChecked || isLoading) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Check admin requirement
    if (requireAdmin && user && user.role !== 'admin') {
      router.push('/dashboard?error=admin_access_required');
      return;
    }

    if (user && roles && !roles.includes(user.role)) {
      // User doesn't have required role - redirect to appropriate dashboard
      const dashboardUrl = user.role === 'admin' ? '/admin' : '/dashboard';
      router.push(`${dashboardUrl}?error=insufficient_permissions`);
      return;
    }
  }, [isAuthenticated, isLoading, user, roles, redirectTo, router, authChecked]);

  // Loading state with enhanced UI
  if (isLoading || !authChecked) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">
            {retryCount > 0 ? 'Retrying authentication...' : 'Verifying your access...'}
          </p>
          {retryCount > 1 && (
            <p className="text-gray-500 text-xs mt-2">
              Connection issues detected. Please check your internet connection.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error && authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setAuthChecked(false);
              setRetryCount(0);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Insufficient permissions state
  if ((requireAdmin && user && user.role !== 'admin') || (roles && user && !roles.includes(user.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m0-6h12M12 3l9 4.5L12 12 3 7.5 12 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. You will be redirected to your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}