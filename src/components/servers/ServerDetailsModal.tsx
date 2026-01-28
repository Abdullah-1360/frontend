'use client';

import React from 'react';
import { Server } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  XMarkIcon,
  ServerIcon,
  KeyIcon,
  LockClosedIcon,
  ComputerDesktopIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ServerDetailsModalProps {
  server: Server | null;
  connectionStatus?: {
    status: 'connected' | 'disconnected' | 'testing' | 'unknown';
    lastTested?: string;
    message?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerDetailsModal({ server, connectionStatus, isOpen, onClose }: ServerDetailsModalProps) {
  if (!isOpen || !server) return null;

  const getConnectionStatusDisplay = () => {
    if (!connectionStatus) return { icon: ClockIcon, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };

    switch (connectionStatus.status) {
      case 'connected':
        return { icon: CheckCircleIcon, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Connected' };
      case 'disconnected':
        return { icon: ExclamationCircleIcon, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Disconnected' };
      case 'testing':
        return { icon: ClockIcon, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Testing...' };
      default:
        return { icon: ClockIcon, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ServerIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
                  <p className="text-sm text-gray-500">Server Details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Connection Status</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                  <statusDisplay.icon className="h-4 w-4 mr-1" />
                  {statusDisplay.label}
                </span>
              </div>
              {connectionStatus?.lastTested && (
                <p className="text-sm text-gray-600 mt-2">
                  Last tested: {formatDate(connectionStatus.lastTested)}
                </p>
              )}
              {connectionStatus?.message && (
                <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border">
                  {connectionStatus.message}
                </div>
              )}
            </div>

            {/* Server Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <ServerIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Server Name</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{server.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Hostname</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 font-mono">{server.hostname}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">SSH Port</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{server.port}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Username</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{server.username}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Authentication</span>
                    </div>
                    <div className="flex items-center">
                      {server.authType === 'key' ? (
                        <>
                          <KeyIcon className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">SSH Key</span>
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="h-4 w-4 text-blue-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Password</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {server.controlPanel && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div className="flex items-center">
                        <ComputerDesktopIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Control Panel</span>
                      </div>
                      <div className="flex items-center">
                        <CogIcon className="h-4 w-4 text-purple-600 mr-1" />
                        <span className="text-sm font-medium text-gray-900 capitalize">{server.controlPanel}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              {server.osInfo && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">System Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Operating System</span>
                      <span className="text-sm font-medium text-gray-900">
                        {server.osInfo.name || 'Linux'} {server.osInfo.version || ''}
                      </span>
                    </div>
                    
                    {server.osInfo.architecture && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Architecture</span>
                        <span className="text-sm font-medium text-gray-900">{server.osInfo.architecture}</span>
                      </div>
                    )}
                    
                    {server.osInfo.kernel && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Kernel</span>
                        <span className="text-sm font-medium text-gray-900">{server.osInfo.kernel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Timestamps</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Added</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(server.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(server.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <KeyIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Security Information:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Credentials are encrypted and stored securely</li>
                      <li>SSH connections use strict host key verification</li>
                      <li>All operations are logged for audit purposes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}