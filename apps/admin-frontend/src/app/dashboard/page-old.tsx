'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient } from '@/services/api-client';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Calling apiClient.getDashboardStats()...');
      const data = await apiClient.getDashboardStats();
      console.log('✅ Dashboard stats loaded successfully:', data);
      setStats(data);
    } catch (error: any) {
      console.error('❌ Error fetching dashboard:', error);
      console.error('❌ Error details:', {
        status: error?.status,
        message: error?.message,
        name: error?.name
      });
      
      // Only redirect on 401/403, not on network errors
      if (error?.status === 401 || error?.status === 403) {
        console.log('🔐 Authentication error, redirecting to login');
        window.location.href = 'https://admin.dev.lowebi.com/';
      } else {
        // Set fallback data and show dashboard even with API errors
        console.log('📊 Setting fallback data and showing dashboard');
        setStats({
          customers: { total: 0, active: 0 },
          sites: { total: 0, active: 0 },
          aiQueue: {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            totalRevenue: 0
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) return;
    setHasInitialized(true);

    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    console.log('🔍 Dashboard useEffect - Token check:', token ? '✅ Found' : '❌ Not found');
    
    if (!token) {
      console.log('❌ No admin token, redirecting to login');
      window.location.href = 'https://admin.dev.lowebi.com/';
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User loaded:', parsedUser.email);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('adminUser');
      }
    }

    console.log('📊 Starting dashboard data fetch...');
    fetchDashboardData();
    
    // Safety timeout: Show dashboard even if API calls fail
    // This ensures the beautiful UI is always visible
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Safety timeout: Showing dashboard with fallback data');
        setStats({
          customers: { total: 0, active: 0 },
          sites: { total: 0, active: 0 },
          aiQueue: {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            totalRevenue: 0
          }
        });
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(safetyTimeout);
  }, []); // Empty dependency array - only run once!

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'https://admin.dev.lowebi.com/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl"
        >
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600 text-sm">Preparing your admin experience...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <span className="text-white font-bold text-lg">LA</span>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  LOGEN Admin Portal
                </h1>
                <p className="text-sm text-slate-600">
                  AI Content Management Dashboard • v2.0
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard/ai-queue"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 group"
                >
                  <span className="group-hover:animate-pulse">🤖</span>
                  <span>AI Queue</span>
                </Link>
              </motion.div>
              {user && (
                <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName || user.email}
                  </p>
                  <p className="text-xs text-slate-600">
                    Administrator
                  </p>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-white/70 hover:bg-white/90 text-gray-700 hover:text-gray-900 font-medium rounded-xl border border-white/30 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <span>🔓</span>
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-3">
            Dashboard Overview
          </h2>
          <p className="text-xl text-slate-600">
            Monitor AI queue performance and system health
          </p>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"
        >
          {/* Total Requests Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Total Requests
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {stats?.aiQueue?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform">
                📋
              </div>
            </div>
          </motion.div>

          {/* Pending Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Pending
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {stats?.aiQueue?.pending || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 group-hover:animate-pulse transition-all">
                ⏳
              </div>
            </div>
          </motion.div>

          {/* Processing Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Processing
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {stats?.aiQueue?.processing || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 group-hover:animate-spin transition-all">
                ⚙️
              </div>
            </div>
          </motion.div>

          {/* Completed Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {stats?.aiQueue?.completed || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform">
                ✅
              </div>
            </div>
          </motion.div>

          {/* Revenue Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  ${(stats?.aiQueue?.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform">
                💰
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/30 shadow-xl"
        >
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6 flex items-center">
            <span className="mr-3 text-3xl">⚡</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/dashboard/ai-queue"
                className="block p-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1 group-hover:text-yellow-200 transition-colors">
                      AI Queue Management
                    </h4>
                    <p className="text-indigo-100 text-sm group-hover:text-white/90 transition-colors">
                      Process customer content generation requests
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-6 bg-slate-100/70 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 group hover:bg-slate-200/70 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-slate-300/70 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-slate-400/70 transition-colors">
                  👥
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1 text-slate-700 group-hover:text-slate-800 transition-colors">
                    Customer Management
                  </h4>
                  <p className="text-slate-500 text-sm group-hover:text-slate-600 transition-colors">
                    Coming Soon - User account management
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}