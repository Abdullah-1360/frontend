'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SiteConfigForm from '@/components/sites/SiteConfigForm';
import SiteDetailsModal from '@/components/sites/SiteDetailsModal';
import { apiClient, Site, Server } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import {
  GlobeAltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ServerIcon,
  CogIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, serversData] = await Promise.all([
          apiClient.getSites(),
          apiClient.getServers()
        ]);
        setSites(sitesData.sites);
        setServers(serversData.servers);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getServerName = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    return server ? server.name : 'Unknown Server';
  };

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

  const handleSiteSave = (savedSite: Site) => {
    if (editingSite) {
      // Update existing site
      setSites(prev => prev.map(site => site.id === savedSite.id ? savedSite : site));
    } else {
      // Add new site
      setSites(prev => [...prev, savedSite]);
    }
    setEditingSite(null);
  };

  const getServerForSite = (serverId: string) => {
    return servers.find(s => s.id === serverId) || null;
  };

  const filteredSites = sites.filter(site =>
    site.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.siteUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage WordPress sites and monitor their health
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Site
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Sites Grid */}
        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => {
              const healthStatus = getHealthStatus(site);
              
              return (
                <div
                  key={site.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border-l-4"
                  style={{ borderLeftColor: healthStatus.status === 'healthy' ? '#10b981' : healthStatus.status === 'inactive' ? '#ef4444' : '#f59e0b' }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <GlobeAltIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {site.domain}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {site.siteUrl}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${healthStatus.bgColor} ${healthStatus.color}`}>
                          {healthStatus.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Server:</span>
                        <span className="text-gray-900 font-medium">{getServerName(site.serverId)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">WordPress Path:</span>
                        <span className="text-gray-900 truncate ml-2">{site.wordpressPath}</span>
                      </div>
                      {site.isMultisite && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Type:</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Multisite
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-500 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {site.lastHealthCheck ? (
                          <>Last check: {formatDate(site.lastHealthCheck)}</>
                        ) : (
                          'Never checked'
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between space-x-2">
                      <button 
                        onClick={() => setSelectedSite(site)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setEditingSite(site)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <CogIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sites found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first WordPress site.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add your first site
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Site Configuration Modal */}
      <SiteConfigForm
        site={editingSite || undefined}
        isOpen={showAddModal || editingSite !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingSite(null);
        }}
        onSave={handleSiteSave}
      />

      {/* Site Details Modal */}
      <SiteDetailsModal
        site={selectedSite}
        server={selectedSite ? getServerForSite(selectedSite.serverId) : null}
        isOpen={selectedSite !== null && !editingSite}
        onClose={() => setSelectedSite(null)}
      />
    </DashboardLayout>
  );
}