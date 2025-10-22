import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DashboardStats } from '@/services/admin-service';

ChartJS.register(ArcElement, Tooltip, Legend);

interface UserDistributionChartProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  stats,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Mock data for user distribution (in a real app, this would come from the API)
  const totalUsers = stats?.userStats.totalUsers || 0;
  const activeUsers = stats?.userStats.activeUsers || 0;
  const inactiveUsers = totalUsers - activeUsers;
  
  // Mock role distribution
  const adminUsers = Math.floor(totalUsers * 0.1); // 10% admins
  const regularUsers = totalUsers - adminUsers;

  const distributionData = {
    labels: ['Active Users', 'Inactive Users'],
    datasets: [
      {
        data: [activeUsers, inactiveUsers],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Green for active
          'rgba(156, 163, 175, 0.8)', // Gray for inactive
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const roleData = {
    labels: ['Regular Users', 'Administrators'],
    datasets: [
      {
        data: [regularUsers, adminUsers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue for users
          'rgba(239, 68, 68, 0.8)',  // Red for admins
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '50%',
  };

  return (
    <div className="space-y-6">
      {/* Activity Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Status</h4>
        <div className="h-48 w-full">
          <Doughnut data={distributionData} options={options} />
        </div>
      </div>

      {/* Role Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Role Distribution</h4>
        <div className="h-48 w-full">
          <Doughnut data={roleData} options={options} />
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Users</span>
          <span className="font-medium text-gray-900">{totalUsers.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Active Rate</span>
          <span className="font-medium text-green-600">
            {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">New This Month</span>
          <span className="font-medium text-blue-600">
            {stats?.userStats.newUsersThisMonth || 0}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Growth Rate</span>
          <span className={`font-medium ${
            (stats?.userStats.userGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(stats?.userStats.userGrowthRate || 0) >= 0 ? '+' : ''}
            {stats?.userStats.userGrowthRate || 0}%
          </span>
        </div>
      </div>
    </div>
  );
};