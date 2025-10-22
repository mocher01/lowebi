'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/protected-route';
import { AdminLayout } from '@/components/admin/layout/admin-layout';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Wait for client-side hydration to complete
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't require admin auth for customer site admin pages
  if (pathname?.startsWith('/admin/sites/')) {
    return <>{children}</>;
  }

  // All other admin pages require admin auth
  return (
    <ProtectedRoute requireAdmin>
      {children}
    </ProtectedRoute>
  );
}