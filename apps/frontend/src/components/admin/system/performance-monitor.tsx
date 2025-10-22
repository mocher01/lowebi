import React from 'react';
import { SystemHealth, DashboardStats } from '@/services/admin-service';

interface PerformanceMonitorProps {
  systemHealth?: SystemHealth;
  stats?: DashboardStats;
  loading?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  systemHealth,
  stats,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPerformanceScore = () => {
    let score = 100;
    
    // Deduct points for high memory usage
    const memoryUsage = systemHealth?.memory.percentage || 0;
    if (memoryUsage > 80) score -= 20;
    else if (memoryUsage > 60) score -= 10;
    
    // Deduct points for slow database response
    const dbResponseTime = systemHealth?.database.responseTime || 0;
    if (dbResponseTime > 500) score -= 15;
    else if (dbResponseTime > 200) score -= 8;
    
    // Deduct points for high connection usage
    const connectionUsage = systemHealth?.database.maxConnections 
      ? (systemHealth.database.activeConnections / systemHealth.database.maxConnections) * 100
      : 0;
    if (connectionUsage > 80) score -= 15;
    else if (connectionUsage > 60) score -= 8;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (score >= 60) {
      return (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  };

  const averageSessionDuration = stats?.sessionStats.averageSessionDuration || 0;
  const formatSessionDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        <p className="text-sm text-gray-600 mt-1">
          Real-time system performance metrics and health indicators
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Score */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${getScoreBgColor(performanceScore)}`}>
              {getScoreIcon(performanceScore)}
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}%
            </div>
            <div className="text-sm text-gray-600">Performance Score</div>
            <div className={`text-xs mt-1 ${getScoreColor(performanceScore)}`}>
              {performanceScore >= 80 ? 'Excellent' :
               performanceScore >= 60 ? 'Good' : 'Needs Attention'}
            </div>
          </div>

          {/* Response Time */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-blue-100">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {systemHealth?.database.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-600">DB Response Time</div>
            <div className={`text-xs mt-1 ${
              (systemHealth?.database.responseTime || 0) < 100 ? 'text-green-600' :
              (systemHealth?.database.responseTime || 0) < 500 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(systemHealth?.database.responseTime || 0) < 100 ? 'Fast' :
               (systemHealth?.database.responseTime || 0) < 500 ? 'Moderate' : 'Slow'}
            </div>
          </div>

          {/* Session Duration */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-purple-100">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatSessionDuration(averageSessionDuration)}
            </div>
            <div className="text-sm text-gray-600">Avg Session Duration</div>
            <div className={`text-xs mt-1 ${
              averageSessionDuration > 30 ? 'text-green-600' :
              averageSessionDuration > 15 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {averageSessionDuration > 30 ? 'High Engagement' :
               averageSessionDuration > 15 ? 'Normal' : 'Low Engagement'}
            </div>
          </div>
        </div>

        {/* Performance Details */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Breakdown</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Metrics */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-600">System Resources</h5>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (systemHealth?.memory.percentage || 0) < 60 ? 'bg-green-500' :
                    (systemHealth?.memory.percentage || 0) < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {systemHealth?.memory.percentage || 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">DB Connections</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    ((systemHealth?.database.activeConnections || 0) / (systemHealth?.database.maxConnections || 1)) < 0.6 ? 'bg-green-500' :
                    ((systemHealth?.database.activeConnections || 0) / (systemHealth?.database.maxConnections || 1)) < 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {systemHealth?.database.activeConnections || 0}/{systemHealth?.database.maxConnections || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* User Activity */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-600">User Activity</h5>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.sessionStats.activeSessions || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Sessions</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.sessionStats.peakConcurrentSessions || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Recommendations */}
        {performanceScore < 80 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Recommendations</h4>
            <div className="space-y-2">
              {(systemHealth?.memory.percentage || 0) > 80 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600">
                    Consider increasing system memory or optimizing memory usage
                  </span>
                </div>
              )}
              
              {(systemHealth?.database.responseTime || 0) > 200 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-1 h-1 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600">
                    Database response time could be improved with query optimization
                  </span>
                </div>
              )}
              
              {((systemHealth?.database.activeConnections || 0) / (systemHealth?.database.maxConnections || 1)) > 0.8 && (
                <div className="flex items-start space-x-2 text-sm">
                  <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600">
                    Database connection pool is near capacity
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};