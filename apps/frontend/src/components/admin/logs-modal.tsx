'use client';

import { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Copy, Check } from 'lucide-react';
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

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
}

export default function LogsModal({ isOpen, onClose, siteId, siteName }: LogsModalProps) {
  const [logs, setLogs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await customerApiClient.get(`/customer/sites/${siteId}/logs?lines=100`);

      if (response.data.success) {
        setLogs(response.data.logs || 'No logs available');
      } else {
        setLogs('Failed to fetch logs: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch logs. Please try again.';
      setLogs('Error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, siteId]);

  useEffect(() => {
    if (logs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Container Logs - {siteName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Refresh Logs"
            >
              <RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin' : '')} />
            </button>
            <button
              onClick={handleCopyLogs}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy All Logs"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="bg-gray-900 rounded-lg p-4 h-full overflow-y-auto font-mono text-sm text-green-400">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">Loading logs...</p>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words">
                {logs.split('\n').map((line, index) => (
                  <div key={index} className="hover:bg-gray-800 px-2 -mx-2 rounded">
                    <span className="text-gray-500 select-none mr-4">{index + 1}</span>
                    <span className={
                      line.toLowerCase().includes('error') ? 'text-red-400' :
                      line.toLowerCase().includes('warn') ? 'text-yellow-400' :
                      line.toLowerCase().includes('info') ? 'text-blue-400' :
                      'text-green-400'
                    }>{line}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </pre>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600 text-center">
          Showing last 100 lines. Click refresh to update.
        </div>
      </div>
    </div>
  );
}
