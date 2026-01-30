'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, Site, Server } from '@/lib/api';
import {
  XMarkIcon,
  GlobeAltIcon,
  ServerIcon,
  FolderIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface SiteConfigFormProps {
  site?: Site;
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: Site) => void;
}

export default function SiteConfigForm({ site, isOpen, onClose, onSave }: SiteConfigFormProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serverId: '',
    domain: '',
    documentRoot: '',
    wordpressPath: '',
    siteUrl: '',
    adminUrl: '',
    isMultisite: false,
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchServers();
      if (site) {
        setFormData({
          serverId: site.serverId,
          domain: site.domain,
          documentRoot: site.documentRoot,
          wordpressPath: site.wordpressPath,
          siteUrl: site.siteUrl,
          adminUrl: site.adminUrl,
          isMultisite: site.isMultisite,
          isActive: site.isActive,
        });
      } else {
        setFormData({
          serverId: '',
          domain: '',
          documentRoot: '',
          wordpressPath: '',
          siteUrl: '',
          adminUrl: '',
          isMultisite: false,
          isActive: true,
        });
      }
    }
  }, [isOpen, site]);

  const fetchServers = async () => {
    try {
      const data = await apiClient.getServers();
      setServers(data.servers);
    } catch (err: any) {
      setError('Failed to load servers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedSite: Site;
      if (site) {
        savedSite = await apiClient.updateSite(site.id, formData);
      } else {
        savedSite = await apiClient.createSite(formData);
      }
      onSave(savedSite);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save site');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateUrls = () => {
    if (formData.domain) {
      const baseUrl = `https://${formData.domain}`;
      setFormData(prev => ({
        ...prev,
        siteUrl: baseUrl,
        adminUrl: `${baseUrl}/wp-admin`
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {site ? 'Edit Site' : 'Add New Site'}
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
              {/* Server Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ServerIcon className="h-4 w-4 inline mr-1" />
                  Server
                </label>
                <select
                  name="serverId"
                  value={formData.serverId}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">Select a server</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>
                      {server.name} ({server.hostname})
                    </option>
                  ))}
                </select>
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  onBlur={generateUrls}
                  placeholder="example.com"
                  required
                  className="form-input"
                />
              </div>

              {/* Document Root */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FolderIcon className="h-4 w-4 inline mr-1" />
                  Document Root
                </label>
                <input
                  type="text"
                  name="documentRoot"
                  value={formData.documentRoot}
                  onChange={handleInputChange}
                  placeholder="/var/www/html"
                  required
                  className="form-input"
                />
              </div>

              {/* WordPress Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FolderIcon className="h-4 w-4 inline mr-1" />
                  WordPress Path
                </label>
                <input
                  type="text"
                  name="wordpressPath"
                  value={formData.wordpressPath}
                  onChange={handleInputChange}
                  placeholder="/var/www/html/wp"
                  required
                  className="form-input"
                />
              </div>

              {/* Site URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <LinkIcon className="h-4 w-4 inline mr-1" />
                  Site URL
                </label>
                <input
                  type="url"
                  name="siteUrl"
                  value={formData.siteUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  required
                  className="form-input"
                />
              </div>

              {/* Admin URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <LinkIcon className="h-4 w-4 inline mr-1" />
                  Admin URL
                </label>
                <input
                  type="url"
                  name="adminUrl"
                  value={formData.adminUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/wp-admin"
                  required
                  className="form-input"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isMultisite"
                    checked={formData.isMultisite}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">WordPress Multisite</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
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
                  {loading ? 'Saving...' : (site ? 'Update Site' : 'Add Site')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}