'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, Server } from '@/lib/api';
import {
  XMarkIcon,
  ServerIcon,
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface ServerConfigFormProps {
  server?: Server;
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: Server) => void;
}

export default function ServerConfigForm({ server, isOpen, onClose, onSave }: ServerConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    port: 22,
    username: '',
    authType: 'key' as 'key' | 'password',
    credentials: '',
    controlPanel: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (server) {
        setFormData({
          name: server.name,
          hostname: server.hostname,
          port: server.port,
          username: server.username,
          authType: server.authType,
          credentials: '', // Don't populate existing credentials for security
          controlPanel: server.controlPanel || '',
        });
      } else {
        setFormData({
          name: '',
          hostname: '',
          port: 22,
          username: '',
          authType: 'key',
          credentials: '',
          controlPanel: '',
        });
      }
      setError(null);
    }
  }, [isOpen, server]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const serverData = {
        name: formData.name,
        hostname: formData.hostname,
        port: formData.port,
        username: formData.username,
        authType: formData.authType,
        controlPanel: formData.controlPanel || undefined,
        // Only include credentials if they were provided
        ...(formData.credentials && { credentials: formData.credentials }),
      };

      let savedServer: Server;
      if (server) {
        savedServer = await apiClient.updateServer(server.id, serverData);
      } else {
        savedServer = await apiClient.createServer(serverData);
      }
      onSave(savedServer);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const controlPanelOptions = [
    { value: '', label: 'None (Raw VPS)' },
    { value: 'cpanel', label: 'cPanel' },
    { value: 'plesk', label: 'Plesk' },
    { value: 'directadmin', label: 'DirectAdmin' },
    { value: 'cyberpanel', label: 'CyberPanel' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ServerIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {server ? 'Edit Server' : 'Add New Server'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ServerIcon className="h-4 w-4 inline mr-1" />
                  Server Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Production Server 1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Hostname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hostname/IP Address
                </label>
                <input
                  type="text"
                  name="hostname"
                  value={formData.hostname}
                  onChange={handleInputChange}
                  placeholder="server.example.com or 192.168.1.100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SSH Port
                </label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  min="1"
                  max="65535"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="root or ubuntu"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Authentication Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Type
                </label>
                <select
                  name="authType"
                  value={formData.authType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="key">SSH Key (Recommended)</option>
                  <option value="password">Password</option>
                </select>
              </div>

              {/* Credentials */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center justify-between">
                    <span>
                      {formData.authType === 'key' ? (
                        <>
                          <KeyIcon className="h-4 w-4 inline mr-1" />
                          Private Key
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="h-4 w-4 inline mr-1" />
                          Password
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showCredentials ? (
                        <>
                          <EyeSlashIcon className="h-4 w-4 inline mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          Show
                        </>
                      )}
                    </button>
                  </div>
                </label>
                {formData.authType === 'key' ? (
                  <textarea
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleInputChange}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    rows={6}
                    required={!server} // Required for new servers
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    style={{ display: showCredentials ? 'block' : 'none' }}
                  />
                ) : (
                  <input
                    type={showCredentials ? 'text' : 'password'}
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required={!server} // Required for new servers
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                {!showCredentials && (
                  <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                    {formData.authType === 'key' ? 'Private key hidden for security' : 'Password hidden for security'}
                  </div>
                )}
                {server && (
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to keep existing credentials
                  </p>
                )}
              </div>

              {/* Control Panel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ComputerDesktopIcon className="h-4 w-4 inline mr-1" />
                  Control Panel
                </label>
                <select
                  name="controlPanel"
                  value={formData.controlPanel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {controlPanelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <KeyIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Security Best Practices:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Use SSH keys instead of passwords when possible</li>
                      <li>Ensure strict host key checking is enabled</li>
                      <li>Use non-root users with sudo access</li>
                      <li>Keep SSH keys secure and rotate them regularly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (server ? 'Update Server' : 'Add Server')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}