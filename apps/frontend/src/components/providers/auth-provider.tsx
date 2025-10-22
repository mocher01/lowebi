'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/customer-auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isAuthenticated, isLoading } = useCustomerAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    // Only check auth on client-side to avoid hydration issues
    if (typeof window === 'undefined') return;
    
    // Skip auth check on public pages that don't need it
    const publicPages = ['/login', '/register', '/'];
    if (publicPages.includes(pathname)) {
      return;
    }
    
    // Skip if we're already authenticated or currently checking
    if (isAuthenticated || isLoading) {
      return;
    }
    
    // Check authentication silently - no automatic redirects
    const timer = setTimeout(() => {
      checkAuth().catch(error => {
        console.debug('Background auth check failed:', error);
        // Individual protected routes will handle redirects
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [checkAuth, pathname, isAuthenticated, isLoading]);

  return <>{children}</>;
}