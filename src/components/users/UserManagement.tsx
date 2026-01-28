'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: 'SUPER_ADMIN' | 'ADMIN' | 'ENGINEER' | 'VIEWER';
    displayName: string;
  };
  mfaEnabled: boolean;
  isActive: boolean;
  isLocked: boolean;
  lockoutUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
  mustChangePassword: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
}

interface UserManagementProps {
  users: User[];
  onUserUpdate: () => void;
  currentUserId: string;
}

const roleColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  ENGINEER: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

export default function UserManagement({ users, onUserUpdate, currentUserId }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRoles = async () => {
    try {
      const response = await apiClient.get('/roles');
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleRoleChange = async (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role.id);
    await loadRoles();
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    setLoading(true);
    setMessage(null);

    try {
      await apiClient.put(`/users/${selectedUser.id}/role`, { roleId: selectedRole });
      setMessage({ type: 'success', text: 'User role updated successfully' });
      setShowRoleModal(false);
      onUserUpdate();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update user role'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUserId) {
      setMessage({ type: 'error', text: 'You cannot deactivate your own account' });
      return;
    }

    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmMessage = user.isActive 
      ? 'Are you sure you want to deactivate this user? They will not be able to login.'
      : 'Are you sure you want to activate this user?';

    if (!confirm(confirmMessage)) return;

    try {
      await apiClient.put(`/users/${user.id}/${action}`);
      setMessage({ 
        type: 'success', 
        text: `User ${action}d successfully` 
      });
      onUserUpdate();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || `Failed to ${action} user`
      });
    }
  };

  const handleUnlockUser = async (user: User) => {
    if (!confirm('Are you sure you want to unlock this user account?')) return;

    try {
      await apiClient.put(`/users/${user.id}/unlock`);
      setMessage({ type: 'success', text: 'User account unlocked successfully' });
      onUserUpdate();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to unlock user account'
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUserId) {
      setMessage({ type: 'error', text: 'You cannot delete your own account' });
      return;
    }

    if (user.role.name === 'SUPER_ADMIN') {
      setMessage({ type: 'error', text: 'Super Admin accounts cannot be deleted' });
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${user.email}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      await apiClient.deleteUser(user.id);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      onUserUpdate();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete user'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName?.[0] || user.username[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username
                          }
                        </p>
                        {user.id === currentUserId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                        {user.mustChangePassword && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Must Change Password
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          roleColors[user.role.name]
                        }`}>
                          {user.role.displayName}
                        </span>
                        <div className="flex items-center space-x-2">
                          {user.mfaEnabled ? (
                            <ShieldCheckIcon className="h-4 w-4 text-green-500" title="MFA Enabled" />
                          ) : (
                            <ShieldExclamationIcon className="h-4 w-4 text-yellow-500" title="MFA Disabled" />
                          )}
                          {user.isLocked ? (
                            <LockClosedIcon className="h-4 w-4 text-red-500" title="Account Locked" />
                          ) : user.isActive ? (
                            <LockOpenIcon className="h-4 w-4 text-green-500" title="Account Active" />
                          ) : (
                            <LockClosedIcon className="h-4 w-4 text-gray-500" title="Account Inactive" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Last login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Role Change Button */}
                    <button
                      onClick={() => handleRoleChange(user)}
                      disabled={user.id === currentUserId && user.role.name === 'SUPER_ADMIN'}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change Role"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>

                    {/* Unlock Button (if locked) */}
                    {user.isLocked && (
                      <button
                        onClick={() => handleUnlockUser(user)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                        title="Unlock Account"
                      >
                        <LockOpenIcon className="h-4 w-4" />
                      </button>
                    )}

                    {/* Activate/Deactivate Button */}
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={user.id === currentUserId}
                      className={`text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                        user.isActive 
                          ? 'text-yellow-600 hover:text-yellow-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUserId || user.role.name === 'SUPER_ADMIN'}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete User"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Role for {selectedUser.email}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Role: {selectedUser.role.displayName}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.displayName} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Changing a user's role will immediately log them out 
                    and they will need to log in again with their new permissions.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={loading || selectedRole === selectedUser.role.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}