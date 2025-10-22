'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';
import { AnalyticsDashboard } from '@/components/admin/analytics/analytics-dashboard';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout
      title="Analytics"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Analytics' }
      ]}
    >
      <AnalyticsDashboard />
    </AdminLayout>
  );
}