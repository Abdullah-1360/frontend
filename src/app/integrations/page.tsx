'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { LinkIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastUsedAt?: string;
  };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    fetchIntegrations();
  }, [filter]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { enabled: filter === 'enabled' } : {};
      const response = await apiClient.get('/integrations', params);
      const integrationsData = response?.data || response || [];
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
    } catch (error: any) {
      console.error('Failed to fetch integrations:', error);
      // Always ensure integrations is an array
      setIntegrations([]);
      // Handle different error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Authentication error - redirect to login
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredIntegrations = Array.isArray(integrations) ? integrations : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect external systems like Slack, PagerDuty, and webhooks
          </p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Integration
        </button>
      </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'enabled', 'disabled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`${
                filter === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading integrations...</p>
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first integration.
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Integration
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <LinkIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{integration.type}</p>
                  </div>
                </div>
                {integration.enabled ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {integration.stats && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Calls</p>
                    <p className="text-lg font-semibold text-gray-900">{integration.stats.totalCalls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {integration.stats.totalCalls > 0
                        ? Math.round((integration.stats.successfulCalls / integration.stats.totalCalls) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Configure
                </button>
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Test
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
