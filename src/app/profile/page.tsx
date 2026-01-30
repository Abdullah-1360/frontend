'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate password change if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (profileData.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!profileData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
      }

      // Handle password change separately if provided
      if (profileData.newPassword) {
        await apiClient.changePassword(
          profileData.currentPassword,
          profileData.newPassword,
          profileData.confirmPassword
        );
      }

      // Handle profile updates (excluding password fields)
      const updateData: any = {};
      
      // Only include email if it changed
      if (profileData.email !== user?.email) {
        updateData.email = profileData.email;
      }

      if (Object.keys(updateData).length > 0) {
        await apiClient.updateUser(user!.id, updateData);
      }

      // Check if any changes were made
      const hasPasswordChange = profileData.newPassword;
      const hasProfileChange = Object.keys(updateData).length > 0;
      
      if (hasPasswordChange || hasProfileChange) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setMessage({ type: 'error', text: 'No changes to save' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSetup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      console.log('[Profile] Starting MFA setup...');
      
      const mfaData = await apiClient.setupMfa();
      console.log('[Profile] MFA setup response:', JSON.stringify(mfaData, null, 2));
      
      setMfaSecret(mfaData.secret);
      setMfaQrCode(mfaData.qrCode);
      setMfaBackupCodes(mfaData.backupCodes || []);
      setShowMfaSetup(true);
      
      console.log('[Profile] MFA setup complete - Secret:', !!mfaData.secret, 'QR Code:', !!mfaData.qrCode, 'Backup Codes:', mfaData.backupCodes?.length || 0);
      
    } catch (error: any) {
      console.error('[Profile] MFA setup error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to setup MFA' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.enableMfa(mfaToken);
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setShowBackupCodes(true); // Show backup codes after successful MFA verification
      setMessage({ type: 'success', text: 'MFA enabled successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Invalid MFA code' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.disableMfa();
      setMfaEnabled(false);
      setMessage({ type: 'success', text: 'MFA disabled successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to disable MFA' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Backup code utility functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard' });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setMessage({ type: 'success', text: 'Copied to clipboard' });
    }
  };

  const copyAllBackupCodes = () => {
    const codesText = mfaBackupCodes.join('\n');
    copyToClipboard(codesText);
  };

  const downloadBackupCodes = () => {
    const codesText = [
      'WP-AutoHealer MFA Backup Codes',
      '================================',
      '',
      'IMPORTANT: Save these codes in a secure location.',
      'Each code can only be used once.',
      '',
      'Generated on: ' + new Date().toLocaleString(),
      '',
      ...mfaBackupCodes.map((code, index) => `${index + 1}. ${code}`)
    ].join('\n');

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wp-autohealer-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupCodesClose = () => {
    if (!backupCodesSaved) {
      if (!confirm('Are you sure you want to close without confirming you\'ve saved your backup codes? You won\'t be able to see them again.')) {
        return;
      }
    }
    setShowBackupCodes(false);
    setBackupCodesSaved(false);
    setMfaBackupCodes([]);
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('Are you sure you want to regenerate your backup codes? This will invalidate all existing backup codes.')) {
      return;
    }

    setLoading(true);
    try {
      const newCodes = await apiClient.regenerateBackupCodes();
      setMfaBackupCodes(newCodes);
      setShowBackupCodes(true);
      setBackupCodesSaved(false);
      setMessage({ type: 'success', text: 'Backup codes regenerated successfully' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to regenerate backup codes' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const sessionsData = await apiClient.getSessions();
      console.log('[Profile] Sessions response:', sessionsData);
      
      // Handle the API response format - sessions should be in the data property
      const sessionsList = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.data || []);
      console.log('[Profile] Processed sessions:', sessionsList);
      
      setSessions(sessionsList);
    } catch (error: any) {
      console.error('[Profile] Failed to load sessions:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load sessions' 
      });
      setSessions([]); // Ensure sessions is always an array
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    try {
      await apiClient.revokeSession(sessionId);
      setMessage({ type: 'success', text: 'Session revoked successfully' });
      loadSessions(); // Reload sessions
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to revoke session' 
      });
    }
  };

  // Load sessions when sessions tab is active
  React.useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'sessions', name: 'Sessions', icon: KeyIcon },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and security preferences
          </p>
        </div>

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

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'profile' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* User Info Display */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user?.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user?.role?.name?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        id="currentPassword"
                        autoComplete="current-password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="mt-1 block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        id="newPassword"
                        autoComplete="new-password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="mt-1 block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-1 block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
              
              {/* MFA Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <KeyIcon className="h-8 w-8 text-gray-400 mr-4" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Multi-Factor Authentication (MFA)
                      </h4>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {mfaEnabled ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleRegenerateBackupCodes}
                          disabled={loading}
                          className="bg-secondary text-foreground hover:bg-secondary/80 px-3 py-1 rounded text-sm transition-colors duration-200 disabled:opacity-50"
                        >
                          Regenerate Codes
                        </button>
                        <button
                          onClick={handleMfaDisable}
                          disabled={loading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1 rounded text-sm transition-colors duration-200 disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleMfaSetup}
                        disabled={loading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enable MFA
                      </button>
                    )}
                  </div>
                </div>

                {/* MFA Setup Modal */}
                {showMfaSetup && (
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Setup Multi-Factor Authentication</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          1. Install an authenticator app like Google Authenticator or Authy on your phone.
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          2. Scan the QR code below or manually enter the secret key.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            QR Code
                          </label>
                          <div className="w-32 h-32 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                            {mfaQrCode ? (
                              <img src={mfaQrCode} alt="MFA QR Code" className="w-full h-full" />
                            ) : (
                              <span className="text-gray-400 text-xs">QR Code</span>
                            )}
                            {/* Debug info */}
                            <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                              QR: {mfaQrCode ? 'SET' : 'EMPTY'}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key
                          </label>
                          <div className="bg-white border border-gray-300 rounded-md p-3 font-mono text-sm break-all">
                            {mfaSecret}
                            {/* Debug info */}
                            <div className="text-xs text-gray-500 mt-1">
                              Secret: {mfaSecret ? 'SET' : 'EMPTY'} ({mfaSecret ? mfaSecret.length : 0} chars)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="mfaToken" className="block text-sm font-medium text-gray-700 mb-2">
                          3. Enter the 6-digit code from your authenticator app
                        </label>
                        <div className="flex space-x-4">
                          <input
                            type="text"
                            id="mfaToken"
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center font-mono"
                            maxLength={6}
                          />
                          <button
                            onClick={handleMfaVerify}
                            disabled={loading || mfaToken.length !== 6}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowMfaSetup(false)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Backup Codes Display Modal */}
                {showBackupCodes && mfaBackupCodes.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-foreground">Your MFA Backup Codes</h4>
                      <ShieldCheckIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-4">
                      {/* Warning Message */}
                      <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-warning mr-3 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-medium text-warning">Important Security Information</h5>
                            <ul className="mt-2 text-sm text-warning space-y-1">
                              <li>• Save these codes in a secure location (password manager, safe, etc.)</li>
                              <li>• Each code can only be used once</li>
                              <li>• You won't be able to see these codes again after closing this window</li>
                              <li>• Use these codes if you lose access to your authenticator app</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={copyAllBackupCodes}
                          className="bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                          Copy All Codes
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download as File
                        </button>
                      </div>

                      {/* Backup Codes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mfaBackupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="bg-muted border border-border rounded-md p-3 flex items-center justify-between"
                          >
                            <span className="font-mono text-sm text-foreground">
                              {code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(code)}
                              className="text-muted-foreground hover:text-foreground transition-colors duration-200 ml-2"
                              title="Copy code"
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Confirmation Checkbox */}
                      <div className="flex items-center space-x-3 p-4 bg-muted rounded-md">
                        <input
                          type="checkbox"
                          id="backupCodesSaved"
                          checked={backupCodesSaved}
                          onChange={(e) => setBackupCodesSaved(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label htmlFor="backupCodesSaved" className="text-sm text-foreground">
                          I have saved my backup codes in a secure location
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={handleBackupCodesClose}
                          className="bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors duration-200"
                        >
                          Close Without Saving
                        </button>
                        <button
                          onClick={() => {
                            setShowBackupCodes(false);
                            setBackupCodesSaved(false);
                            setMfaBackupCodes([]);
                          }}
                          disabled={!backupCodesSaved}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Security Recommendations</h4>
                      <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>• Use a strong, unique password for your account</li>
                        <li>• Enable MFA for additional security</li>
                        <li>• Regularly review your account activity</li>
                        <li>• Keep your authenticator app secure and backed up</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
                <button
                  onClick={loadSessions}
                  disabled={loadingSessions}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loadingSessions ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingSessions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-4 ${
                        session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {session.deviceInfo || 'Unknown Device'}
                            </h4>
                            {session.isCurrent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 space-y-1">
                            <p>IP Address: {session.ipAddress}</p>
                            <p>Last Activity: {formatDate(session.lastActivityAt)}</p>
                            <p>Created: {formatDate(session.createdAt)}</p>
                            {session.userAgent && (
                              <p className="truncate">Browser: {session.userAgent}</p>
                            )}
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="ml-4 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Session Security Info */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Session Security</h4>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• Sessions automatically expire after 7 days of inactivity</li>
                      <li>• You can revoke any session except your current one</li>
                      <li>• Changing your password will revoke all other sessions</li>
                      <li>• Monitor this page regularly for unauthorized access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}