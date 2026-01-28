'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, User } from '@/lib/api';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface CreateUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: string;
  mustChangePassword: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create user form state
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    roleId: '',
    mustChangePassword: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiClient.getRoles();
      setRoles(response || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiClient.createUser(createUserData);
      setUsers([...users, response.user]);
      setGeneratedPassword(response.temporaryPassword);
      setMessage({ type: 'success', text: 'User created successfully' });
      
      // Reset form but keep modal open to show password
      setCreateUserData({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        roleId: '',
        mustChangePassword: true,
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create user' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await apiClient.updateUser(userId, updates);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      setMessage({ type: 'success', text: 'User updated successfully' });
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update user' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      await apiClient.updateUserStatus(userId, endpoint);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: !isActive } : u
      ));
      setMessage({ 
        type: 'success', 
        text: `User ${isActive ? 'deactivated' : 'activated'} successfully` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update user status' 
      });
    }
  };

  const handleUnlockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unlock this user account?')) {
      return;
    }

    try {
      await apiClient.unlockUser(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isLocked: false, lockoutUntil: undefined } : u
      ));
      setMessage({ type: 'success', text: 'User unlocked successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to unlock user' 
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete user' 
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !selectedRole || user.role.name === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENGINEER': return 'bg-green-100 text-green-800 border-green-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (user: User) => {
    if (!user.isActive) {
      return <XCircleIcon className="h-5 w-5 text-destructive" title="Inactive" />;
    }
    if (user.isLocked) {
      return <LockClosedIcon className="h-5 w-5 text-warning" title="Locked" />;
    }
    return <CheckCircleIcon className="h-5 w-5 text-success" title="Active" />;
  };

  // Check if current user can manage users
  const canManageUsers = currentUser?.role.permissions.some(p => 
    p.resource === 'users' && ['create', 'update', 'delete'].includes(p.action)
  );

  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to manage users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Create User
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md border ${
            message.type === 'success' 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                Search Users
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-md placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Search by email, username, or name..."
                />
              </div>
            </div>
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-foreground mb-2">
                Filter by Role
              </label>
              <select
                id="role-filter"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    MFA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getRoleColor(user.role.name)}`}>
                          {user.role.displayName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(user)}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {!user.isActive ? 'Inactive' : user.isLocked ? 'Locked' : 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShieldCheckIcon className={`h-4 w-4 mr-1 ${user.mfaEnabled ? 'text-success' : 'text-muted-foreground'}`} />
                          <span className="text-sm text-muted-foreground">
                            {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                            title="Edit user"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          {user.isLocked && (
                            <button
                              onClick={() => handleUnlockUser(user.id)}
                              className="text-warning hover:text-warning/80 transition-colors duration-200"
                              title="Unlock user"
                            >
                              <LockOpenIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className={`transition-colors duration-200 ${
                              user.isActive 
                                ? 'text-warning hover:text-warning/80' 
                                : 'text-success hover:text-success/80'
                            }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? (
                              <LockClosedIcon className="h-4 w-4" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors duration-200"
                              title="Delete user"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {generatedPassword ? 'User Created Successfully' : 'Create New User'}
              </h3>
              
              {generatedPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-md">
                    <p className="text-sm text-success mb-2">
                      User created successfully! Here are the login credentials:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Temporary Password:
                        </label>
                        <div className="flex items-center mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {showPassword ? generatedPassword : '••••••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="ml-2 p-2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      The user must change this password on first login.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setGeneratedPassword('');
                        setShowPassword(false);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        required
                        value={createUserData.firstName}
                        onChange={(e) => setCreateUserData({ ...createUserData, firstName: e.target.value })}
                        className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        required
                        value={createUserData.lastName}
                        onChange={(e) => setCreateUserData({ ...createUserData, lastName: e.target.value })}
                        className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={createUserData.username}
                      onChange={(e) => setCreateUserData({ ...createUserData, username: e.target.value })}
                      className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      required
                      value={createUserData.roleId}
                      onChange={(e) => setCreateUserData({ ...createUserData, roleId: e.target.value })}
                      className="block w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="mustChangePassword"
                      type="checkbox"
                      checked={createUserData.mustChangePassword}
                      onChange={(e) => setCreateUserData({ ...createUserData, mustChangePassword: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label htmlFor="mustChangePassword" className="ml-2 block text-sm text-foreground">
                      Require password change on first login
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}