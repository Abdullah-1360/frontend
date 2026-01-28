'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentTextIcon, ClockIcon, TrashIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RetentionPolicy {
  id: string;
  policyName: string;
  retentionDays: number;
  appliesTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PurgeAudit {
  id: string;
  tableName: string;
  recordsPurged: number;
  cutoffDate: string;
  executedAt: string;
  executedBy?: string;
}

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [purgeAudits, setPurgeAudits] = useState<PurgeAudit[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<'policies' | 'audit'>('policies');

  // Check if user has permission to access policies
  const hasPolicyAccess = user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN';

  useEffect(() => {
    if (!hasPolicyAccess) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    fetchData();
  }, [hasPolicyAccess]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, auditsRes, statsRes] = await Promise.all([
        apiClient.get('/retention/policies').catch(err => {
          if (err.response?.status === 401) {
            window.location.href = '/login';
            return { data: [] };
          } else if (err.response?.status === 403) {
            setAccessDenied(true);
            return { data: [] };
          }
          return { data: [] };
        }),
        apiClient.get('/retention/audit/purge', { limit: 20 }).catch(err => {
          if (err.response?.status === 401) {
            window.location.href = '/login';
            return { data: [] };
          } else if (err.response?.status === 403) {
            setAccessDenied(true);
            return { data: [] };
          }
          return { data: [] };
        }),
        apiClient.get('/retention/statistics').catch(err => {
          if (err.response?.status === 401) {
            window.location.href = '/login';
            return { data: { activePolicies: 0, totalRecordsPurged: 0 } };
          } else if (err.response?.status === 403) {
            setAccessDenied(true);
            return { data: { activePolicies: 0, totalRecordsPurged: 0 } };
          }
          return { data: { activePolicies: 0, totalRecordsPurged: 0 } };
        }),
      ]);

      const policiesData = policiesRes?.data || [];
      const auditsData = auditsRes?.data || [];
      
      setPolicies(Array.isArray(policiesData) ? policiesData : []);
      setPurgeAudits(Array.isArray(auditsData) ? auditsData : []);
      setStats(statsRes?.data || { activePolicies: 0, totalRecordsPurged: 0 });
    } catch (error) {
      console.error('Failed to fetch retention data:', error);
      setPolicies([]);
      setPurgeAudits([]);
      setStats({ activePolicies: 0, totalRecordsPurged: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {accessDenied ? (
          // Access Denied UI
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to access data retention policies. This feature is only available to administrators.
            </p>
            <div className="mt-6">
              <p className="text-xs text-gray-400">
                Current role: <span className="font-medium">{user?.role?.name || 'Unknown'}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Required roles: Super Admin, Admin
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Retention Policies</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage data retention and automatic purging (1-7 days hard cap)
                </p>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Policy
              </button>
            </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Policies</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.activePolicies || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Default Retention</dt>
                    <dd className="text-lg font-semibold text-gray-900">3 Days</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Purged</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalRecordsPurged?.toLocaleString() || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Last Purge</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.lastPurgeAt ? new Date(stats.lastPurgeAt).toLocaleDateString() : 'Never'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('policies')}
            className={`${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Retention Policies
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Purge Audit Log
          </button>
        </nav>
      </div>

        {/* Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : activeTab === 'policies' ? (
          policies.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No policies configured</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a retention policy.</p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Policy
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Policy Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retention Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applies To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{policy.policyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{policy.retentionDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{policy.appliesTo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {policy.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records Purged
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cutoff Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executed By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purgeAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(audit.executedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {audit.tableName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.recordsPurged.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(audit.cutoffDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {audit.executedBy || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          )}
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
