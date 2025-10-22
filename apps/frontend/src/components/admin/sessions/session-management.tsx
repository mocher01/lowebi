'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, Session } from '@/services/admin-service';
import { DataTable, TableColumn, TableAction } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export const SessionManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
  });

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<Session | null>(null);
  const [terminationReason, setTerminationReason] = useState('');

  const {
    data: sessionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'sessions', query],
    queryFn: () => adminService.getAllSessions(query.page, query.limit),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const terminateSessionMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) =>
      adminService.terminateSession(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      setShowTerminateModal(false);
      setSessionToTerminate(null);
      setTerminationReason('');
    },
  });

  const terminateUserSessionsMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.terminateAllUserSessions(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
    },
  });

  const handlePageChange = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }));
  }, []);

  const handleTerminateSession = (session: Session) => {
    setSessionToTerminate(session);
    setShowTerminateModal(true);
  };

  const handleTerminateAllUserSessions = (session: Session) => {
    if (confirm(`Are you sure you want to terminate ALL sessions for ${session.userEmail}?`)) {
      terminateUserSessionsMutation.mutate({
        userId: session.userId,
        reason: 'Admin terminated all user sessions',
      });
    }
  };

  const confirmTermination = () => {
    if (sessionToTerminate) {
      terminateSessionMutation.mutate({
        sessionId: sessionToTerminate.id,
        reason: terminationReason || 'Terminated by admin',
      });
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const isSessionExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const columns: TableColumn<Session>[] = [
    {
      key: 'user',
      title: 'User',
      render: (_, session) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {session.userFirstName[0]}{session.userLastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {session.userFirstName} {session.userLastName}
            </div>
            <div className="text-sm text-gray-500">{session.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'device',
      title: 'Device & Location',
      render: (_, session) => (
        <div className="flex items-center space-x-2">
          <div className="text-gray-500">
            {getDeviceIcon(session.deviceType)}
          </div>
          <div>
            <div className="text-sm text-gray-900">
              {session.browser || 'Unknown Browser'}
            </div>
            <div className="text-xs text-gray-500">
              {session.operatingSystem || 'Unknown OS'}
            </div>
            {session.city && session.country && (
              <div className="text-xs text-gray-500">
                {session.city}, {session.country}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      title: 'IP Address',
      render: (ipAddress) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {ipAddress}
        </code>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, session) => {
        const expired = isSessionExpired(session.expiresAt);
        return (
          <Badge
            variant={expired ? 'warning' : 'success'}
            size="sm"
          >
            {expired ? 'Expired' : 'Active'}
          </Badge>
        );
      },
    },
    {
      key: 'lastActivity',
      title: 'Last Activity',
      render: (lastActivity) => (
        <div className="text-sm text-gray-900">
          <div>{getRelativeTime(lastActivity)}</div>
          <div className="text-xs text-gray-500">
            {new Date(lastActivity).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (createdAt) => (
        <div className="text-sm text-gray-900">
          <div>{getRelativeTime(createdAt)}</div>
          <div className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleString()}
          </div>
        </div>
      ),
    },
  ];

  const actions: TableAction<Session>[] = [
    {
      label: 'Terminate',
      onClick: handleTerminateSession,
      variant: 'danger',
      disabled: (session) => isSessionExpired(session.expiresAt),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      label: 'Terminate All User Sessions',
      onClick: handleTerminateAllUserSessions,
      variant: 'danger',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  const activeSessions = sessionsData?.data.filter(session => !isSessionExpired(session.expiresAt)) || [];
  const expiredSessions = sessionsData?.data.filter(session => isSessionExpired(session.expiresAt)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
          <p className="text-sm text-gray-600">
            Monitor and manage user sessions across the platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{activeSessions.length}</span> active sessions
          </div>
          <Button
            variant="secondary"
            onClick={() => refetch()}
            loading={isLoading}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Sessions Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{activeSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{expiredSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(sessionsData?.data.map(s => s.userId)).size || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <DataTable
        data={sessionsData?.data || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        pagination={sessionsData?.pagination}
        onPageChange={handlePageChange}
        emptyMessage="No sessions found"
      />

      {/* Terminate Session Modal */}
      {showTerminateModal && sessionToTerminate && (
        <Modal
          isOpen={showTerminateModal}
          onClose={() => {
            setShowTerminateModal(false);
            setSessionToTerminate(null);
            setTerminationReason('');
          }}
          title="Terminate Session"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTerminateModal(false);
                  setSessionToTerminate(null);
                  setTerminationReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmTermination}
                loading={terminateSessionMutation.isPending}
              >
                Terminate Session
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Terminate session for {sessionToTerminate.userFirstName} {sessionToTerminate.userLastName}
                </h4>
                <p className="text-sm text-gray-600">{sessionToTerminate.userEmail}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Are you sure you want to terminate this session? The user will be logged out immediately.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter reason for termination..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};