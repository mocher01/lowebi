'use client';

import { motion } from 'framer-motion';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import { useCustomerAuthStore } from '@/store/customer-auth-store';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useCustomerAuthStore();

  const quickActions = [
    {
      title: 'Create New Website',
      description: 'Start building a new website with AI assistance',
      icon: (
        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: '/sites/create',
      color: 'indigo',
    },
    {
      title: 'Manage Sites',
      description: 'View and edit your existing websites',
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9h9m-9 0l9-9m0 0L12 3m0 0l9 9" />
        </svg>
      ),
      href: '/sites',
      color: 'purple',
    },
    {
      title: 'Templates Library',
      description: 'Browse and use professional templates',
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/templates',
      color: 'green',
    },
    {
      title: 'Account Settings',
      description: 'Manage your profile and preferences',
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/account',
      color: 'blue',
    },
  ];

  const stats = [
    { name: 'Total Sites', value: '3', change: '+2', changeType: 'increase' },
    { name: 'Active Sites', value: '2', change: '0', changeType: 'neutral' },
    { name: 'Views This Month', value: '1,234', change: '+12%', changeType: 'increase' },
    { name: 'Storage Used', value: '45 MB', change: '+5 MB', changeType: 'increase' },
  ];

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="p-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <p className="text-gray-600">
              Let's continue building amazing websites
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
                  <div className="mt-2 flex items-center">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    href={action.href}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-6 group"
                  >
                    <div className="flex items-center mb-4">
                      <div className={`p-2 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                        {action.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Recent Sites */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Sites</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">My Business Website</h4>
                      <p className="text-sm text-gray-500">Last updated 2 hours ago</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Live
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Portfolio Site</h4>
                      <p className="text-sm text-gray-500">Last updated 1 day ago</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link
                    href="/sites"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    View all sites →
                  </Link>
                </div>
              </div>
            </div>

            {/* Tips & Resources */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Tips & Resources</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">Getting Started Guide</h4>
                    <p className="text-sm text-indigo-700 mb-3">
                      Learn how to create your first website with our step-by-step guide.
                    </p>
                    <Link
                      href="/help/getting-started"
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      Read guide →
                    </Link>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">AI Content Features</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Discover how AI can help you create better content faster.
                    </p>
                    <Link
                      href="/help/ai-features"
                      className="text-purple-600 hover:text-purple-500 text-sm font-medium"
                    >
                      Learn more →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}