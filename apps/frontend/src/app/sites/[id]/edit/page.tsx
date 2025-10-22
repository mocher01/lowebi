'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';

export default function EditSitePage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  useEffect(() => {
    // For now, redirect to the wizard with the site ID
    // This will load the existing site data for editing
    console.log('Editing site:', siteId);
    
    // Redirect to wizard with edit mode
    router.replace(`/wizard?edit=${siteId}`);
  }, [siteId, router]);

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading site editor...</p>
            <p className="text-sm text-gray-500">Site ID: {siteId}</p>
          </div>
        </div>
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}