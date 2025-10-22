'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/layout/admin-layout';
import { UserManagement } from '@/components/admin/users/user-management';

export default function AdminUsersPage() {
  return (
    <AdminLayout
      title="User Management"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'User Management' }
      ]}
    >
      <UserManagement />
    </AdminLayout>
  );
}