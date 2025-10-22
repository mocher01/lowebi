import React from 'react';
import { SystemHealth } from '@/services/admin-service';

interface SystemMetricsProps {
  systemHealth?: SystemHealth;
  loading?: boolean;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  systemHealth,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, index) => (
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getMetricColor = (percentage: number, reverse = false) => {
    if (reverse) {
      if (percentage < 30) return 'bg-red-500';
      if (percentage < 70) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (percentage < 50) return 'bg-green-500';
      if (percentage < 80) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  const getTextColor = (percentage: number, reverse = false) => {
    if (reverse) {
      if (percentage < 30) return 'text-red-600';
      if (percentage < 70) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (percentage < 50) return 'text-green-600';
      if (percentage < 80) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const memoryPercentage = systemHealth?.memory.percentage || 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Memory Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            <span className={`text-sm font-medium ${getTextColor(memoryPercentage)}`}>
              {memoryPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getMetricColor(memoryPercentage)}`}
              style={{ width: `${memoryPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatBytes(systemHealth?.memory.used)}</span>
            <span>{formatBytes(systemHealth?.memory.total)}</span>
          </div>
        </div>

        {/* System Uptime */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">System Uptime</span>
            <span className="text-sm font-medium text-green-600">
              {formatUptime(systemHealth?.uptime)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">System running normally</span>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Health Indicators</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {systemHealth?.database.responseTime || 0}ms
                </div>
                <div className="text-xs text-gray-600">DB Response</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {systemHealth?.database.activeConnections || 0}
                </div>
                <div className="text-xs text-gray-600">DB Connections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Breakdown */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Memory Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used Memory</span>
              <span className="font-medium text-gray-900">
                {formatBytes(systemHealth?.memory.used)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available Memory</span>
              <span className="font-medium text-gray-900">
                {formatBytes((systemHealth?.memory.total || 0) - (systemHealth?.memory.used || 0))}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Memory</span>
              <span className="font-medium text-gray-900">
                {formatBytes(systemHealth?.memory.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Status */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              memoryPercentage < 80 ? 'bg-green-500' : 
              memoryPercentage < 90 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${getTextColor(memoryPercentage)}`}>
              {memoryPercentage < 80 ? 'Optimal Performance' :
               memoryPercentage < 90 ? 'Moderate Load' : 'High Load'}
            </span>
          </div>
        </div>

        {/* Recommendations */}
        {memoryPercentage > 85 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-red-800">High Memory Usage</h5>
                <p className="text-sm text-red-700 mt-1">
                  Memory usage is at {memoryPercentage}%. Consider restarting services or increasing system memory.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};