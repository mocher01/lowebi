import React from 'react';
import { motion } from 'framer-motion';
import { SystemHealth } from '@/services/admin-service';
import { Badge } from '@/components/ui/badge';

interface SystemStatusProps {
  systemHealth?: SystemHealth;
  loading?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  systemHealth,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <Badge
            variant={getStatusColor(systemHealth?.status || 'default')}
            size="sm"
          >
            {systemHealth?.status || 'Unknown'}
          </Badge>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <div className="text-center py-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            systemHealth?.status === 'healthy' ? 'bg-green-100' :
            systemHealth?.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {systemHealth?.status === 'healthy' ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : systemHealth?.status === 'warning' ? (
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600">
            System running for {systemHealth ? formatUptime(systemHealth.uptime) : 'Unknown'}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {/* Database */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={systemHealth?.database.status === 'connected' ? 'success' : 'danger'}
                  size="sm"
                >
                  {systemHealth?.database.status || 'Unknown'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {systemHealth?.database.responseTime}ms
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, ((systemHealth?.database.activeConnections || 0) / (systemHealth?.database.maxConnections || 1)) * 100)}%` 
                }}
                className={`h-2 rounded-full ${
                  systemHealth?.database.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{systemHealth?.database.activeConnections || 0} active</span>
              <span>{systemHealth?.database.maxConnections || 0} max</span>
            </div>
          </div>

          {/* Memory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <span className="text-xs text-gray-500">
                {systemHealth?.memory.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${systemHealth?.memory.percentage || 0}%` }}
                className={`h-2 rounded-full ${
                  (systemHealth?.memory.percentage || 0) < 70 ? 'bg-green-500' :
                  (systemHealth?.memory.percentage || 0) < 90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{systemHealth ? formatBytes(systemHealth.memory.used) : '0 B'} used</span>
              <span>{systemHealth ? formatBytes(systemHealth.memory.total) : '0 B'} total</span>
            </div>
          </div>

          {/* Last Checked */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Last checked: {systemHealth?.lastChecked ? new Date(systemHealth.lastChecked).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};