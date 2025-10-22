'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';
import { SessionManagement } from '@/components/admin/sessions/session-management';

export default function AdminSessionsPage() {
  return (
    <AdminLayout
      title="Session Management"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Sessions' }
      ]}
    >
      <SessionManagement />
    </AdminLayout>
  );
}