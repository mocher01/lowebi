'use client';

import { motion } from 'framer-motion';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import { useCustomerAuthStore } from '@/store/customer-auth-store';

export default function BillingPage() {
  const { user } = useCustomerAuthStore();

  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        '3 websites',
        '10 GB storage',
        'Basic templates',
        'Email support',
        'SSL certificates',
      ],
      current: user?.subscriptionStatus === 'trial',
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Best for growing businesses',
      features: [
        '10 websites',
        '50 GB storage',
        'Premium templates',
        'AI content generation',
        'Priority support',
        'Custom domains',
        'Analytics dashboard',
      ],
      current: user?.subscriptionStatus === 'active',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large organizations',
      features: [
        'Unlimited websites',
        '500 GB storage',
        'Custom templates',
        'Advanced AI features',
        '24/7 phone support',
        'White-label solutions',
        'Advanced analytics',
        'API access',
      ],
      current: false,
    },
  ];

  const invoices = [
    {
      id: 'INV-001',
      date: '2024-01-15',
      amount: '$29.00',
      status: 'paid',
      plan: 'Professional Plan',
    },
    {
      id: 'INV-002',
      date: '2023-12-15',
      amount: '$29.00',
      status: 'paid',
      plan: 'Professional Plan',
    },
    {
      id: 'INV-003',
      date: '2023-11-15',
      amount: '$29.00',
      status: 'paid',
      plan: 'Professional Plan',
    },
  ];

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

            {/* Current Plan */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.subscriptionStatus === 'active' ? 'Professional Plan' : 'Starter Plan (Trial)'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {user?.subscriptionStatus === 'active' 
                        ? 'Billed monthly • Next billing date: February 15, 2024'
                        : 'Trial expires in 12 days'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {user?.subscriptionStatus === 'active' ? '$29' : '$0'}
                    </p>
                    <p className="text-gray-600">per month</p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                    {user?.subscriptionStatus === 'active' ? 'Change Plan' : 'Upgrade Now'}
                  </button>
                  {user?.subscriptionStatus === 'active' && (
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Available Plans */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`relative bg-white rounded-lg shadow-lg ${
                      plan.popular ? 'ring-2 ring-indigo-600' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-indigo-600 text-white px-4 py-1 text-sm rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                      <p className="mt-2 text-gray-600">{plan.description}</p>
                      
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      
                      <ul className="mt-6 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-8">
                        {plan.current ? (
                          <button
                            disabled
                            className="w-full bg-gray-100 text-gray-400 py-3 px-4 rounded-md cursor-not-allowed"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button className={`w-full py-3 px-4 rounded-md transition-colors ${
                            plan.popular
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                          }`}>
                            {user?.subscriptionStatus === 'trial' ? 'Choose Plan' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Billing History</h2>
              </div>
              
              <div className="p-6">
                {invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.plan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {invoice.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-indigo-600 hover:text-indigo-500">
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't been billed yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white shadow rounded-lg mt-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}