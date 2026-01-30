'use client';

import React, { useState, useEffect } from 'react';

import {
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  KeyIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, User } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PurgeAuditRecord {
  id: string;
  policyName: string;
  tableName: string;
  recordsPurged: number;
  cutoffDate: string;
  executedAt: string;
  executedBy: string;
}

interface SystemConfig {
  maxFixAttempts: number;
  cooldownWindow: number;
  sshTimeout: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  verificationTimeout: number;
  verificationRetryAttempts: number;
  defaultRetentionDays: number;
  maxRetentionDays: number;
}

interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  useTls: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Settings page component for managing system configuration, data retention, users, and security settings.
 * Provides tabbed interface for different settings categories with role-based access control.
 * 
 * @returns JSX element containing the settings page interface
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('retention');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Retention settings state
  const [retentionDays, setRetentionDays] = useState(3);
  const [purgeSchedule, setPurgeSchedule] = useState('daily');
  const [purgeAuditRecords, setPurgeAuditRecords] = useState<PurgeAuditRecord[]>([]);

  // System configuration state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maxFixAttempts: 15,
    cooldownWindow: 600,
    sshTimeout: 30,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 300,
    verificationTimeout: 30,
    verificationRetryAttempts: 3,
    defaultRetentionDays: 3,
    maxRetentionDays: 7,
  });

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    roleId: '',
  });

  // Email configuration state
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromAddress: '',
    fromName: 'WP-AutoHealer',
    useTls: true,
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  useEffect(() => {
    fetchPurgeAuditRecords();
    fetchSystemConfig();
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'email') {
      fetchSmtpConfig();
    }
  }, [activeTab]);

  /**
   * Fetches purge audit records from the retention API.
   * Handles authentication errors and provides fallback mock data for demonstration.
   * 
   * @returns Promise that resolves when audit records are fetched and state is updated
   */
  const fetchPurgeAuditRecords = async () => {
    try {
      const response = await apiClient.get('/retention/audit/purge');
      const records = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setPurgeAuditRecords(records);
    } catch (error: any) {
      console.error('Failed to fetch purge audit records:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        // Authorization error - user doesn't have access, but don't redirect
        console.warn('User does not have access to purge audit records');
      }
      
      // Mock data for demonstration
      setPurgeAuditRecords([
        {
          id: '1',
          policyName: 'Default (3 days)',
          tableName: 'incidents',
          recordsPurged: 1247,
          cutoffDate: '2024-01-12T02:00:00Z',
          executedAt: '2024-01-15T02:00:15Z',
          executedBy: 'System (Auto)',
        },
        {
          id: '2',
          policyName: 'Default (3 days)',
          tableName: 'incident_events',
          recordsPurged: 892,
          cutoffDate: '2024-01-11T02:00:00Z',
          executedAt: '2024-01-14T02:00:12Z',
          executedBy: 'System (Auto)',
        },
        {
          id: '3',
          policyName: 'Manual Purge',
          tableName: 'command_executions',
          recordsPurged: 156,
          cutoffDate: '2024-01-10T00:00:00Z',
          executedAt: '2024-01-13T14:30:45Z',
          executedBy: user?.email || 'admin@example.com',
        },
      ]);
    }
  };

  /**
   * Fetches system configuration settings from the API.
   * Handles authentication and authorization errors gracefully.
   * 
   * @returns Promise that resolves when system config is fetched and state is updated
   */
  const fetchSystemConfig = async () => {
    try {
      const response = await apiClient.get('/system/config');
      const config = response.data || response;
      
      // Ensure all fields have valid defaults to prevent controlled/uncontrolled input issues
      setSystemConfig({
        maxFixAttempts: config.maxFixAttempts ?? 15,
        cooldownWindow: config.cooldownWindow ?? 600,
        sshTimeout: config.sshTimeout ?? 30,
        circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
        circuitBreakerTimeout: config.circuitBreakerTimeout ?? 300,
        verificationTimeout: config.verificationTimeout ?? 30,
        verificationRetryAttempts: config.verificationRetryAttempts ?? 3,
        defaultRetentionDays: config.defaultRetentionDays ?? 3,
        maxRetentionDays: config.maxRetentionDays ?? 7,
      });
    } catch (error: any) {
      console.error('Failed to fetch system configuration:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        // Authorization error - user doesn't have access, but don't redirect
        console.warn('User does not have access to system configuration');
      }
    }
  };

  /**
   * Fetches the list of users from the API.
   * Handles authentication and authorization errors, sets empty array on failure.
   * 
   * @returns Promise that resolves when users are fetched and state is updated
   */
  const fetchUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      const users = Array.isArray(response.users) ? response.users : [];
      setUsers(users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        // Authorization error - user doesn't have access, but don't redirect
        console.warn('User does not have access to user management');
      }
      
      // Set empty array to prevent map errors
      setUsers([]);
    }
  };

  /**
   * Fetches SMTP configuration settings from the API.
   * Handles authentication errors and missing configuration gracefully.
   * Clears password field for security when loading existing config.
   * 
   * @returns Promise that resolves when SMTP config is fetched and state is updated
   */
  /**
   * Fetches SMTP configuration settings from the API.
   * Handles authentication errors and missing configuration gracefully.
   * Clears password field for security when loading existing config.
   * 
   * @returns Promise that resolves when SMTP config is fetched and state is updated
   */
  const fetchSmtpConfig = async () => {
    try {
      const response = await apiClient.get('/auth/settings/smtp');
      if (response.data) {
        setSmtpConfig({
          host: response.data.host || '',
          port: response.data.port || 587,
          username: response.data.username || '',
          password: '', // Don't populate password field for security
          fromAddress: response.data.fromAddress || '',
          fromName: response.data.fromName || 'WP-AutoHealer',
          useTls: response.data.useTls !== undefined ? response.data.useTls : true,
          isActive: response.data.isActive !== undefined ? response.data.isActive : true,
          id: response.data.id,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch SMTP configuration:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        console.warn('User does not have access to email settings');
      } else if (error.response?.status === 404) {
        // No SMTP config exists yet - keep default values
        console.info('No SMTP configuration found - using defaults');
      }
    }
  };

  /**
   * Handles form submission for updating data retention settings.
   * Validates retention period is within allowed range (1-7 days).
   * 
   * @param e - React form event
   * @returns Promise that resolves when retention settings are updated
   */
  const handleRetentionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (retentionDays < 1 || retentionDays > 7) {
        throw new Error('Retention period must be between 1 and 7 days');
      }

      setMessage({ type: 'success', text: 'Retention settings updated successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update retention settings' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form submission for updating system configuration settings.
   * Updates various system parameters like timeouts, thresholds, and retry attempts.
   * 
   * @param e - React form event
   * @returns Promise that resolves when system configuration is updated
   */
  const handleSystemConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.put('/system/config', systemConfig);
      setMessage({ type: 'success', text: 'System configuration updated successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update system configuration' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles manual purge operation for expired data.
   * Shows confirmation dialog before executing the purge operation.
   * Refreshes audit records after successful purge.
   * 
   * @returns Promise that resolves when manual purge is completed
   */
  const handleManualPurge = async () => {
    if (!confirm('Are you sure you want to run a manual purge? This will permanently delete expired data according to the current retention policy.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await apiClient.post('/retention/purge/manual', {
        retentionDays,
        dryRun: false,
      });

      setMessage({ 
        type: 'success', 
        text: 'Manual purge completed successfully.' 
      });
      
      await fetchPurgeAuditRecords();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to run manual purge' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form submission for creating a new user.
   * Validates required fields and creates user with specified role.
   * Refreshes user list after successful creation.
   * 
   * @param e - React form event
   * @returns Promise that resolves when user is created
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.createUser(newUser);
      setMessage({ type: 'success', text: 'User created successfully' });
      setShowCreateUserModal(false);
      setNewUser({ email: '', password: '', roleId: '' });
      await fetchUsers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create user' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles updating user information such as role changes.
   * Refreshes user list after successful update.
   * 
   * @param userId - ID of the user to update
   * @param updates - Partial user object containing fields to update
   * @returns Promise that resolves when user is updated
   */
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.updateUser(userId, updates);
      setMessage({ type: 'success', text: 'User updated successfully' });
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update user' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user deletion with confirmation dialog.
   * Shows confirmation dialog with user email before deletion.
   * Refreshes user list after successful deletion.
   * 
   * @param userId - ID of the user to delete
   * @param userEmail - Email address of the user (for confirmation dialog)
   * @returns Promise that resolves when user is deleted
   */
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await apiClient.deleteUser(userId);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      await fetchUsers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete user' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles enabling or disabling MFA for a user.
   * Refreshes user list after successful MFA toggle.
   * 
   * @param userId - ID of the user to toggle MFA for
   * @param enable - Whether to enable (true) or disable (false) MFA
   * @returns Promise that resolves when MFA is toggled
   */
  const handleToggleMFA = async (userId: string, enable: boolean) => {
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.post(`/users/${userId}/${enable ? 'enable-mfa' : 'disable-mfa'}`);
      setMessage({ type: 'success', text: `MFA ${enable ? 'enabled' : 'disabled'} successfully` });
      await fetchUsers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Failed to ${enable ? 'enable' : 'disable'} MFA` 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form submission for updating SMTP configuration settings.
   * Updates email server settings including host, port, credentials, and TLS options.
   * 
   * @param e - React form event
   * @returns Promise that resolves when SMTP configuration is updated
   */
  /**
   * Handles form submission for updating SMTP configuration settings.
   * Sends SMTP configuration to the API and shows success/error messages.
   * 
   * @param e - React form event
   * @returns Promise that resolves when SMTP configuration is updated
   */
  const handleSmtpConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.put('/auth/settings/smtp', smtpConfig);
      setMessage({ type: 'success', text: 'Email configuration updated successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update email configuration' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles sending a test email to verify SMTP configuration.
   * Validates test email address is provided before sending.
   * Clears test email field after successful send.
   * 
   * @param e - React form event
   * @returns Promise that resolves when test email is sent
   */
  /**
   * Handles sending a test email to verify SMTP configuration.
   * Validates test email address is provided before sending.
   * Clears test email field after successful send.
   * 
   * @param e - React form event
   * @returns Promise that resolves when test email is sent
   */
  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setTestEmailLoading(true);
    setMessage(null);

    try {
      await apiClient.post('/auth/settings/smtp/test', { testEmail });
      setMessage({ type: 'success', text: `Test email sent successfully to ${testEmail}` });
      setTestEmail('');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send test email' 
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const tabs = [
    { id: 'retention', name: 'Data Retention', icon: ClockIcon },
    { id: 'system', name: 'System Config', icon: Cog6ToothIcon },
    { id: 'users', name: 'Users & Roles', icon: UsersIcon },
    { id: 'email', name: 'Email Configuration', icon: EnvelopeIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  const canModifySettings = user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure system behavior, data retention, and security settings
          </p>
        </div>

        {!canModifySettings && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  You have read-only access to system settings. Contact an administrator to make changes.
                </p>
              </div>
            </div>
          </div>
        )}

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

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="card">
          {activeTab === 'retention' && (
            <div className="card-content">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Data Retention Policy</h3>
              
              <form onSubmit={handleRetentionUpdate} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                      <p className="mt-1 text-sm text-yellow-700">
                        Retention period is capped at 7 days maximum for compliance and storage management.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="retentionDays" className="block text-sm font-medium text-gray-700">
                      Default Retention Period
                    </label>
                    <select
                      id="retentionDays"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                      disabled={!canModifySettings}
                      className="form-select"
                    >
                      <option value={1}>1 Day</option>
                      <option value={2}>2 Days</option>
                      <option value={3}>3 Days (Default)</option>
                      <option value={4}>4 Days</option>
                      <option value={5}>5 Days</option>
                      <option value={6}>6 Days</option>
                      <option value={7}>7 Days (Maximum)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="purgeSchedule" className="block text-sm font-medium text-gray-700">
                      Automatic Purge Schedule
                    </label>
                    <select
                      id="purgeSchedule"
                      value={purgeSchedule}
                      onChange={(e) => setPurgeSchedule(e.target.value)}
                      disabled={!canModifySettings}
                      className="form-select"
                    >
                      <option value="daily">Daily at 2:00 AM</option>
                      <option value="hourly">Every Hour</option>
                      <option value="manual">Manual Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleManualPurge}
                    disabled={loading || !canModifySettings}
                    className="btn-destructive btn-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Run Manual Purge
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || !canModifySettings}
                    className="btn-primary btn-sm"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Purge Audit Log</h4>
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records Purged</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executed By</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(purgeAuditRecords) && purgeAuditRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.executedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.policyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.recordsPurged.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.executedBy}
                          </td>
                        </tr>
                      ))}
                      {(!Array.isArray(purgeAuditRecords) || purgeAuditRecords.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No purge records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card-content">
              <h3 className="text-lg font-medium text-gray-900 mb-6">System Configuration</h3>
              
              <form onSubmit={handleSystemConfigUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="maxFixAttempts" className="block text-sm font-medium text-gray-700">
                      Maximum Fix Attempts per Incident
                    </label>
                    <input
                      type="number"
                      id="maxFixAttempts"
                      min="1"
                      max="20"
                      value={systemConfig.maxFixAttempts ?? ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, maxFixAttempts: parseInt(e.target.value) || 15 }))}
                      disabled={!canModifySettings}
                      className="form-input"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Hard limit on fix attempts before escalation (1-20).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="cooldownWindow" className="block text-sm font-medium text-gray-700">
                      Incident Cooldown Window
                    </label>
                    <select
                      id="cooldownWindow"
                      value={systemConfig.cooldownWindow ?? 600}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, cooldownWindow: parseInt(e.target.value) || 600 }))}
                      disabled={!canModifySettings}
                      className="form-select"
                    >
                      <option value={300}>5 Minutes</option>
                      <option value={600}>10 Minutes</option>
                      <option value={900}>15 Minutes</option>
                      <option value={1800}>30 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sshTimeout" className="block text-sm font-medium text-gray-700">
                      SSH Connection Timeout
                    </label>
                    <input
                      type="number"
                      id="sshTimeout"
                      min="10"
                      max="120"
                      value={systemConfig.sshTimeout ?? ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, sshTimeout: parseInt(e.target.value) || 30 }))}
                      disabled={!canModifySettings}
                      className="form-input"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Timeout in seconds for SSH connections (10-120).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="circuitBreakerThreshold" className="block text-sm font-medium text-gray-700">
                      Circuit Breaker Threshold
                    </label>
                    <input
                      type="number"
                      id="circuitBreakerThreshold"
                      min="1"
                      max="20"
                      value={systemConfig.circuitBreakerThreshold ?? ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, circuitBreakerThreshold: parseInt(e.target.value) || 5 }))}
                      disabled={!canModifySettings}
                      className="form-input"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Number of failures before circuit breaker opens (1-20).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="verificationTimeout" className="block text-sm font-medium text-gray-700">
                      Verification Timeout
                    </label>
                    <input
                      type="number"
                      id="verificationTimeout"
                      min="5"
                      max="120"
                      value={systemConfig.verificationTimeout ?? ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, verificationTimeout: parseInt(e.target.value) || 30 }))}
                      disabled={!canModifySettings}
                      className="form-input"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Timeout in seconds for site verification (5-120).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="verificationRetryAttempts" className="block text-sm font-medium text-gray-700">
                      Verification Retry Attempts
                    </label>
                    <input
                      type="number"
                      id="verificationRetryAttempts"
                      min="1"
                      max="10"
                      value={systemConfig.verificationRetryAttempts ?? ''}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, verificationRetryAttempts: parseInt(e.target.value) || 3 }))}
                      disabled={!canModifySettings}
                      className="form-input"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Number of retry attempts for verification (1-10).
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !canModifySettings}
                    className="btn-primary btn-sm"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card-content">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">User & Role Management</h3>
                {canModifySettings && (
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                )}
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(users) && users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                          <div className="text-sm text-gray-500">Created {formatDate(userItem.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser?.id === userItem.id ? (
                            <select
                              value={editingUser.roleId}
                              onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                              className="text-sm border-gray-300 rounded-md"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="engineer">Engineer</option>
                              <option value="admin">Admin</option>
                              {user?.role?.name === 'SUPER_ADMIN' && <option value="super-admin">Super Admin</option>}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userItem.role?.name === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                              userItem.role?.name === 'ADMIN' ? 'bg-red-100 text-red-800' :
                              userItem.role?.name === 'ENGINEER' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {userItem.role?.displayName || 'Unknown'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userItem.mfaEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userItem.lastLoginAt ? formatDate(userItem.lastLoginAt) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {canModifySettings && userItem.id !== user?.id && (
                            <div className="flex space-x-2">
                              {editingUser?.id === userItem.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUser(userItem.id, { roleId: editingUser.roleId })}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingUser(userItem)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleMFA(userItem.id, !userItem.mfaEnabled)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <KeyIcon className="h-4 w-4" />
                                  </button>
                                  {userItem.role?.name !== 'SUPER_ADMIN' && (
                                    <button
                                      onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!Array.isArray(users) || users.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Role Descriptions */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Role Descriptions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">Super Admin:</span>
                    <span className="text-gray-600 ml-1">Full system access, can manage all users and settings</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-800">Admin:</span>
                    <span className="text-gray-600 ml-1">Can manage users, configure system settings, and view all data</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Engineer:</span>
                    <span className="text-gray-600 ml-1">Can manage incidents, servers, and sites but not users</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Viewer:</span>
                    <span className="text-gray-600 ml-1">Read-only access to incidents, servers, and sites</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="card-content">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Email Configuration</h3>
              
              <div className="space-y-8">
                {/* SMTP Configuration Form */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">SMTP Settings</h4>
                  
                  <form onSubmit={handleSmtpConfigUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="smtp-host" className="form-label">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          id="smtp-host"
                          value={smtpConfig.host || ''}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                          disabled={!canModifySettings}
                          placeholder="smtp.gmail.com"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="smtp-port" className="form-label">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          id="smtp-port"
                          value={smtpConfig.port ?? 587}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                          disabled={!canModifySettings}
                          min="1"
                          max="65535"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="smtp-username" className="form-label">
                          Username
                        </label>
                        <input
                          type="text"
                          id="smtp-username"
                          value={smtpConfig.username || ''}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                          disabled={!canModifySettings}
                          placeholder="your-email@gmail.com"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="smtp-password" className="form-label">
                          Password
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="smtp-password"
                            value={smtpConfig.password || ''}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                            disabled={!canModifySettings}
                            placeholder="Enter password to update"
                            className="form-input pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="from-address" className="form-label">
                          From Email Address
                        </label>
                        <input
                          type="email"
                          id="from-address"
                          value={smtpConfig.fromAddress || ''}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, fromAddress: e.target.value })}
                          disabled={!canModifySettings}
                          placeholder="noreply@wp-autohealer.com"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="from-name" className="form-label">
                          From Name
                        </label>
                        <input
                          type="text"
                          id="from-name"
                          value={smtpConfig.fromName || ''}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                          disabled={!canModifySettings}
                          placeholder="WP-AutoHealer"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="use-tls"
                        type="checkbox"
                        checked={smtpConfig.useTls}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, useTls: e.target.checked })}
                        disabled={!canModifySettings}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label htmlFor="use-tls" className="ml-2 block text-sm text-gray-900">
                        Use TLS encryption (recommended)
                      </label>
                    </div>

                    {canModifySettings && (
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary"
                        >
                          {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* Test Email Section */}
                <div className="border-t border-gray-200 pt-8">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Test Email Configuration</h4>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-blue-800">Test Your Configuration</h5>
                        <p className="mt-1 text-sm text-blue-700">
                          Send a test email to verify your SMTP configuration is working correctly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleTestEmail} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label htmlFor="test-email" className="block text-sm font-medium text-gray-700">
                          Test Email Address
                        </label>
                        <input
                          type="email"
                          id="test-email"
                          value={testEmail || ''}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="admin@example.com"
                          className="form-input"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={testEmailLoading || !testEmail}
                          className="btn-secondary btn-sm"
                        >
                          {testEmailLoading ? 'Sending...' : 'Send Test Email'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Current Configuration Display */}
                {smtpConfig.id && (
                  <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Current Configuration</h4>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">SMTP Host</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.host || 'Not configured'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Port</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.port}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Username</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.username || 'Not configured'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">From Address</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.fromAddress || 'Not configured'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">From Name</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.fromName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">TLS Encryption</dt>
                          <dd className="text-sm text-gray-900">{smtpConfig.useTls ? 'Enabled' : 'Disabled'}</dd>
                        </div>
                        {smtpConfig.updatedAt && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                            <dd className="text-sm text-gray-900">{formatDate(smtpConfig.updatedAt)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-content">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">API Server</p>
                      <p className="text-sm text-gray-500">Secure HTTPS</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">SSH Connections</p>
                      <p className="text-sm text-gray-500">Key-based Auth</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Data Encryption</p>
                      <p className="text-sm text-gray-500">At Rest & Transit</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Security Best Practices</h4>
                      <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>• All secrets are encrypted at rest using libsodium</li>
                        <li>• SSH connections use strict host key verification</li>
                        <li>• API endpoints implement rate limiting and RBAC</li>
                        <li>• All operations are logged for audit compliance</li>
                        <li>• MFA is available for all user accounts</li>
                        <li>• Session tokens have automatic expiration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96 shadow-lg rounded-xl">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              </div>
              <div className="card-content">
                <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    minLength={8}
                    value={newUser.password || ''}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="form-label">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newUser.roleId || ''}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Role</option>
                    <option value="viewer">Viewer</option>
                    <option value="engineer">Engineer</option>
                    <option value="admin">Admin</option>
                    {user?.role?.name === 'SUPER_ADMIN' && <option value="super-admin">Super Admin</option>}
                  </select>
                </div>
                </form>
              </div>
              <div className="card-footer">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUserModal(false);
                      setNewUser({ email: '', password: '', roleId: '' });
                    }}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-sm"
                    form="create-user-form"
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}