'use client';

import React from 'react';
import { Site, Server } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  XMarkIcon,
  GlobeAltIcon,
  ServerIcon,
  FolderIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface SiteDetailsModalProps {
  site: Site | null;
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SiteDetailsModal({ site, server, isOpen, onClose }: SiteDetailsModalProps) {
  if (!isOpen || !site) return null;

  const getHealthStatus = (site: Site) => {
    if (!site.lastHealthCheck) {
      return { status: 'unknown', color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Never checked' };
    }
    
    const lastCheck = new Date(site.lastHealthCheck);
    const now = new Date();
    const hoursSinceCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
    
    if (!site.isActive) {
      return { status: 'inactive', color: 'text-red-500', bgColor: 'bg-red-100', label: 'Inactive' };
    }
    
    if (hoursSinceCheck > 24) {
      return { status: 'stale', color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Check overdue' };
    }
    
    return { status: 'healthy', color: 'text-green-500', bgColor: 'bg-green-100', label: 'Healthy' };
  };

  const healthStatus = getHealthStatus(site);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <GlobeAltIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{site.domain}</h3>
                  <p className="text-sm text-gray-500">Site Details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Health Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Health Status</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${healthStatus.bgColor} ${healthStatus.color}`}>
                  {healthStatus.status === 'healthy' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                  {healthStatus.status === 'inactive' && <ExclamationCircleIcon className="h-4 w-4 mr-1" />}
                  {healthStatus.status === 'stale' && <ClockIcon className="h-4 w-4 mr-1" />}
                  {healthStatus.status === 'unknown' && <ClockIcon className="h-4 w-4 mr-1" />}
                  {healthStatus.label}
                </span>
              </div>
              {site.lastHealthCheck && (
                <p className="text-sm text-gray-600 mt-2">
                  Last health check: {formatDate(site.lastHealthCheck)}
                </p>
              )}
            </div>

            {/* Site Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Site Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Domain</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{site.domain}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Site URL</span>
                    </div>
                    <a 
                      href={site.siteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {site.siteUrl}
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Admin URL</span>
                    </div>
                    <a 
                      href={site.adminUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {site.adminUrl}
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <FolderIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Document Root</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 font-mono">{site.documentRoot}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <FolderIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">WordPress Path</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 font-mono">{site.wordpressPath}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Type</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {site.isMultisite && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Multisite
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${site.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {site.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Information */}
              {server && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Server Information</h4>
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
                      <span className="text-sm font-medium text-gray-900 font-mono">{server.hostname}:{server.port}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">Username</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{server.username}</span>
                    </div>
                    
                    {server.controlPanel && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">Control Panel</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{server.controlPanel}</span>
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
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(site.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(site.updatedAt)}</span>
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