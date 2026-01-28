'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardDocumentListIcon, FunnelIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  traceId?: string;
  correlationId?: string;
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
  });

  // Check if user has permission to access audit logs
  const hasAuditAccess = user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN';

  useEffect(() => {
    if (!hasAuditAccess) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    fetchAuditEvents();
  }, [page, filters, hasAuditAccess]);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      };
      const response = await apiClient.getAuditEvents(params);
      const eventsData = response?.data?.events || response?.events || response?.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTotal(response?.data?.total || response?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch audit events:', error);
      // Always ensure events is an array
      setEvents([]);
      setTotal(0);
      // Handle different error types
      if (error.response?.status === 401) {
        // Authentication error - redirect to login
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        // Authorization error - show access denied
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.startsWith('AUTH_')) return 'bg-blue-100 text-blue-800';
    if (action.startsWith('SECURITY_')) return 'bg-red-100 text-red-800';
    if (action.startsWith('DATA_')) return 'bg-green-100 text-green-800';
    if (action.startsWith('INCIDENT_')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
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
              You don't have permission to access audit logs. This feature is only available to administrators.
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
              <p className="mt-1 text-sm text-gray-500">
                Complete audit trail of all system operations and security events
              </p>
            </div>

        {/* Filters */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="text"
            placeholder="Filter by resource type..."
            value={filters.resourceType}
            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <input
            type="text"
            placeholder="Filter by user ID..."
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={() => setFilters({ action: '', resourceType: '', userId: '' })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

        {/* Audit Events Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading audit events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit events</h3>
            <p className="mt-1 text-sm text-gray-500">
              Audit events will appear here as they occur.
            </p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trace ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(event.action)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.resourceType}</div>
                      {event.resourceId && (
                        <div className="text-sm text-gray-500">{event.resourceId.slice(0, 8)}...</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.userId ? event.userId.slice(0, 8) + '...' : 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {event.traceId ? event.traceId.slice(0, 8) + '...' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 50 >= total}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 50, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * 50 >= total}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
