'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService, DashboardStats, AdminActivity } from '@/services/admin-service';
import { StatsCard } from './stats-card';
import { ActivityFeed } from './activity-feed';
import { QuickActions } from './quick-actions';
import { SystemStatus } from './system-status';

export const DashboardOverview: React.FC = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: activity,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'activity'],
    queryFn: () => adminService.getAdminActivity(1, 10),
    refetchInterval: 60000, // Refresh every minute
  });

  const {
    data: systemHealth,
    isLoading: healthLoading,
  } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">
                Unable to load dashboard statistics. Please try refreshing the page.
              </p>
              <button
                onClick={() => refetchStats()}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.userStats.totalUsers || 0}
          change={{
            value: stats?.userStats.userGrowthRate || 0,
            label: 'from last month',
            trend: (stats?.userStats.userGrowthRate || 0) > 0 ? 'up' : 
                   (stats?.userStats.userGrowthRate || 0) < 0 ? 'down' : 'neutral',
          }}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="blue"
          loading={statsLoading}
        />

        <StatsCard
          title="Active Sessions"
          value={stats?.sessionStats.activeSessions || 0}
          change={{
            value: 12,
            label: 'vs yesterday',
            trend: 'up',
          }}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color="green"
          loading={statsLoading}
        />

        <StatsCard
          title="New Users Today"
          value={stats?.userStats.newUsersToday || 0}
          change={{
            value: stats?.userStats.newUsersThisWeek ? 
              Math.round(((stats.userStats.newUsersToday || 0) / (stats.userStats.newUsersThisWeek || 1)) * 100) : 0,
            label: 'of weekly target',
            trend: 'up',
          }}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          color="purple"
          loading={statsLoading}
        />

        <StatsCard
          title="System Health"
          value={systemHealth?.status === 'healthy' ? 'Healthy' : 
                 systemHealth?.status === 'warning' ? 'Warning' : 'Critical'}
          change={{
            value: Math.round((systemHealth?.uptime || 0) / 86400), // Convert to days
            label: 'days uptime',
            trend: 'up',
          }}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
          color={
            systemHealth?.status === 'healthy' ? 'green' :
            systemHealth?.status === 'warning' ? 'yellow' : 'red'
          }
          loading={healthLoading}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* System Status */}
        <div className="lg:col-span-1">
          <SystemStatus systemHealth={systemHealth} loading={healthLoading} />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed activity={activity} loading={activityLoading} />
        </div>
      </div>
    </div>
  );
};