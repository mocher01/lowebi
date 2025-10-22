'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, User, UserListQuery } from '@/services/admin-service';
import { DataTable, TableColumn, TableAction } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { UserEditModal } from './user-edit-modal';
import { UserCreateModal } from './user-create-modal';
import { useRouter, useSearchParams } from 'next/navigation';

export const UserManagement: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Check if create action is requested via URL
  React.useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
      // Clear the URL parameter
      router.replace('/admin/users');
    }
  }, [searchParams, router]);

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => adminService.getUsers(query),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowDeleteModal(false);
      setUserToDelete(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminService.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      // Show success message
      console.log('Password reset successfully');
    },
  });

  const handleSearch = useCallback((search: string) => {
    setQuery(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }));
  }, []);

  const handleSort = useCallback((sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    setQuery(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleResetPassword = (user: User) => {
    // Generate a temporary password
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8);
    resetPasswordMutation.mutate({
      userId: user.id,
      newPassword: tempPassword,
    });
  };

  const handleUserCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    setShowCreateModal(false);
  };

  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const columns: TableColumn<User>[] = [
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (email, user) => (
        <div>
          <div className="font-medium text-gray-900">{email}</div>
          <div className="text-sm text-gray-500">
            {user.firstName} {user.lastName}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (role) => (
        <Badge
          variant={role === 'ADMIN' ? 'danger' : 'default'}
          size="sm"
        >
          {role}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (isActive, user) => (
        <div className="flex flex-col space-y-1">
          <Badge
            variant={isActive ? 'success' : 'warning'}
            size="sm"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
          {user.emailVerified && (
            <Badge variant="info" size="sm">
              Verified
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      title: 'Last Login',
      render: (lastLoginAt) => lastLoginAt ? (
        <div className="text-sm text-gray-900">
          {new Date(lastLoginAt).toLocaleDateString()}
          <div className="text-xs text-gray-500">
            {new Date(lastLoginAt).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-500">Never</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (createdAt) => (
        <div className="text-sm text-gray-900">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const actions: TableAction<User>[] = [
    {
      label: 'Edit',
      onClick: handleEditUser,
      variant: 'secondary',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Reset Password',
      onClick: handleResetPassword,
      variant: 'secondary',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 10.257a6 6 0 115.486-5.486L15 9.828A2 2 0 0115 7z" />
        </svg>
      ),
    },
    {
      label: 'Delete',
      onClick: handleDeleteUser,
      variant: 'danger',
      disabled: (user) => user.role === 'ADMIN', // Prevent deleting admin users
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={query.role || ''}
          onChange={(e) => setQuery(prev => ({ ...prev, role: e.target.value as any, page: 1 }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>

        <select
          value={query.isActive !== undefined ? query.isActive.toString() : ''}
          onChange={(e) => setQuery(prev => ({ 
            ...prev, 
            isActive: e.target.value === '' ? undefined : e.target.value === 'true',
            page: 1
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

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

      {/* Users Table */}
      <DataTable
        data={usersData?.data || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        pagination={usersData?.pagination}
        onPageChange={handlePageChange}
        onSort={handleSort}
        searchValue={query.search || ''}
        onSearchChange={handleSearch}
        emptyMessage="No users found"
      />

      {/* Modals */}
      {showCreateModal && (
        <UserCreateModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          title="Delete User"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                loading={deleteUserMutation.isPending}
              >
                Delete User
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
                  Delete {userToDelete.firstName} {userToDelete.lastName}
                </h4>
                <p className="text-sm text-gray-600">{userToDelete.email}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this user? This action cannot be undone.
              The user will be deactivated and all their sessions will be terminated.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};