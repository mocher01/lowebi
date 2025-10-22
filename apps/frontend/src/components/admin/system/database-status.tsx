import React from 'react';
import { SystemHealth } from '@/services/admin-service';
import { Badge } from '@/components/ui/badge';

interface DatabaseStatusProps {
  systemHealth?: SystemHealth;
  loading?: boolean;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({
  systemHealth,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
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

  const database = systemHealth?.database;
  const connectionPercentage = database 
    ? Math.round((database.activeConnections / database.maxConnections) * 100)
    : 0;

  const getConnectionColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConnectionBgColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
          <Badge
            variant={database?.status === 'connected' ? 'success' : 'danger'}
            size="sm"
          >
            {database?.status || 'Unknown'}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            database?.status === 'connected' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {database?.status === 'connected' ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className={`font-semibold ${
            database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
          }`}>
            {database?.status === 'connected' ? 'Connected' : 'Disconnected'}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {/* Response Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Response Time</span>
              <span className="text-sm text-gray-600">
                {database?.responseTime || 0}ms
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (database?.responseTime || 0) < 100 ? 'bg-green-500' :
                  (database?.responseTime || 0) < 500 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(100, (database?.responseTime || 0) / 10)}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast (&lt;100ms)</span>
              <span>Slow (&gt;500ms)</span>
            </div>
          </div>

          {/* Active Connections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Connections</span>
              <span className={`text-sm font-medium ${getConnectionColor(connectionPercentage)}`}>
                {database?.activeConnections || 0} / {database?.maxConnections || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getConnectionBgColor(connectionPercentage)}`}
                style={{ width: `${connectionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{connectionPercentage}%</span>
              <span>{database?.maxConnections || 0}</span>
            </div>
          </div>

          {/* Connection Pool Health */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Connection Pool Health</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pool Status</span>
                <span className={`font-medium ${
                  connectionPercentage < 80 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionPercentage < 80 ? 'Healthy' : 'Under Pressure'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available Connections</span>
                <span className="font-medium text-gray-900">
                  {(database?.maxConnections || 0) - (database?.activeConnections || 0)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Utilization</span>
                <span className={`font-medium ${getConnectionColor(connectionPercentage)}`}>
                  {connectionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {connectionPercentage > 80 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-yellow-800">High Connection Usage</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Database connection pool is at {connectionPercentage}% capacity. 
                  Consider increasing the pool size or optimizing queries.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};