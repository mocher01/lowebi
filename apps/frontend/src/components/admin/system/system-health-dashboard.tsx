'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemMetrics } from './system-metrics';
import { DatabaseStatus } from './database-status';
import { PerformanceMonitor } from './performance-monitor';

export const SystemHealthDashboard: React.FC = () => {
  const {
    data: systemHealth,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: 30000,
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">System Health Check Failed</h3>
            <p className="text-red-700 mt-1">Unable to retrieve system health information.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">System Status Overview</h2>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              loading={isLoading}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mb-4">
                {getStatusIcon(systemHealth?.status)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                System {systemHealth?.status === 'healthy' ? 'Healthy' : 
                        systemHealth?.status === 'warning' ? 'Warning' : 'Critical'}
              </h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Uptime:</span> {formatUptime(systemHealth?.uptime)}
                </div>
                <div>
                  <span className="font-medium">Last Check:</span>{' '}
                  {systemHealth?.lastChecked 
                    ? new Date(systemHealth.lastChecked).toLocaleTimeString()
                    : 'Never'}
                </div>
              </div>
              
              <div className="mt-4">
                <Badge
                  variant={
                    systemHealth?.status === 'healthy' ? 'success' :
                    systemHealth?.status === 'warning' ? 'warning' : 'danger'
                  }
                  size="lg"
                >
                  {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Status */}
        <DatabaseStatus systemHealth={systemHealth} loading={isLoading} />

        {/* System Metrics */}
        <SystemMetrics systemHealth={systemHealth} loading={isLoading} />
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor 
        systemHealth={systemHealth} 
        stats={stats}
        loading={isLoading || statsLoading} 
      />

      {/* System Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.userStats.totalUsers || 0}
              </div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.sessionStats.activeSessions || 0}
              </div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemHealth?.database.activeConnections || 0}
              </div>
              <div className="text-sm text-gray-600">DB Connections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {systemHealth?.memory.percentage || 0}%
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};