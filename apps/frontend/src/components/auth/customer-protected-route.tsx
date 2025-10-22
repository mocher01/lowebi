'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/customer-auth-store';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export default function CustomerProtectedRoute({ children }: CustomerProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, user } = useCustomerAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Ensure we're on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't do anything until mounted on client
    if (!isMounted) return;

    const verifyAuth = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('customer_access_token');
        console.log('[CustomerProtectedRoute] Checking auth, token:', token ? 'exists' : 'missing');

        if (!token) {
          // No token, redirect to login
          console.log('[CustomerProtectedRoute] No token, redirecting to login');
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        // If already authenticated in store, we're good
        if (isAuthenticated && user) {
          console.log('[CustomerProtectedRoute] Already authenticated');
          setIsChecking(false);
          return;
        }

        // Check authentication with backend
        console.log('[CustomerProtectedRoute] Verifying token with backend...');
        await checkAuth();

        // After checkAuth, verify we're authenticated
        const authStore = useCustomerAuthStore.getState();
        if (authStore.isAuthenticated) {
          console.log('[CustomerProtectedRoute] Authentication verified');
          setIsChecking(false);
        } else {
          console.log('[CustomerProtectedRoute] Authentication failed');
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (error) {
        console.error('[CustomerProtectedRoute] Auth check error:', error);
        // Clear invalid token and redirect
        localStorage.removeItem('customer_access_token');
        document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    verifyAuth();
  }, [isMounted, pathname, checkAuth, router, isAuthenticated, user]);

  // Show loading until mounted and auth checked
  if (!isMounted || isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Redirect in progress
  return null;
}