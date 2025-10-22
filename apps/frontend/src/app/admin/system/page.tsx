'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';
import { SystemHealthDashboard } from '@/components/admin/system/system-health-dashboard';

export default function AdminSystemPage() {
  return (
    <AdminLayout
      title="System Health"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'System Health' }
      ]}
    >
      <SystemHealthDashboard />
    </AdminLayout>
  );
}