'use client';

import { useState } from 'react';
import { RotateCw, FileText, Trash2 } from 'lucide-react';
import axios from 'axios';

// Create customer API client with proper auth handling
const customerApiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 10000,
  withCredentials: true,
});

// Set up request interceptor to add auth token
customerApiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface QuickActionsProps {
  siteId: string;
  siteName: string;
  onViewLogs: () => void;
  onSiteDeleted?: () => void;
}

export default function QuickActions({ siteId, siteName, onViewLogs, onSiteDeleted }: QuickActionsProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRestartSite = async () => {
    setIsRestarting(true);
    try {
      const response = await customerApiClient.post(`/customer/sites/${siteId}/restart`, {});

      if (response.data.success) {
        showToast('Site container restarted successfully', 'success');
      } else {
        showToast(response.data.message || 'Failed to restart site', 'error');
      }
    } catch (error: any) {
      console.error('Error restarting site:', error);
      const errorMessage = error.response?.data?.message || 'Failed to restart site. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsRestarting(false);
    }
  };

  const handleDeleteSite = async () => {
    setIsDeleting(true);
    try {
      // Use wizard-sessions endpoint for deleting sites
      const response = await customerApiClient.delete(`/customer/wizard-sessions/${siteId}`);

      if (response.data.success || response.status === 200 || response.status === 204) {
        showToast('Site deleted successfully', 'success');
        setTimeout(() => {
          if (onSiteDeleted) {
            onSiteDeleted();
          } else {
            window.location.href = '/sites';
          }
        }, 1500);
      } else {
        showToast(response.data.message || 'Failed to delete site', 'error');
        setIsDeleting(false);
      }
    } catch (error: any) {
      console.error('Error deleting site:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete site. Please try again.';
      showToast(errorMessage, 'error');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRestartSite}
            disabled={isRestarting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw className={'w-4 h-4 ' + (isRestarting ? 'animate-spin' : '')} />
            <span>{isRestarting ? 'Restarting...' : 'Restart Container'}</span>
          </button>

          <button
            onClick={onViewLogs}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>View Logs</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Site'}</span>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Site?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{siteName}"? This action cannot be undone. The site files and Docker container will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteSite();
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all text-white ' + (toast.type === 'success' ? 'bg-green-500' : 'bg-red-500')}>
          {toast.message}
        </div>
      )}
    </>
  );
}
