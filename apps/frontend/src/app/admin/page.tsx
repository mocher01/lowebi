'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';
import { DashboardOverview } from '@/components/admin/dashboard/dashboard-overview';

export default function AdminDashboardPage() {
  return (
    <AdminLayout
      title="Dashboard"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Dashboard' }
      ]}
    >
      <DashboardOverview />
    </AdminLayout>
  );
}