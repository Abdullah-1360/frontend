'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IncidentStatusBadge from '@/components/incidents/IncidentStatusBadge';
import IncidentPriorityBadge from '@/components/incidents/IncidentPriorityBadge';
import IncidentStats from '@/components/incidents/IncidentStats';
import { apiClient, Incident } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await apiClient.getIncidents();
        setIncidents(data.incidents);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.triggerType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || incident.state === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewIncident = (incidentId: string) => {
    router.push(`/incidents/${incidentId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage WordPress site incidents
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Incident
          </button>
        </div>

        {/* Stats */}
        <IncidentStats incidents={incidents} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="NEW">New</option>
                <option value="DISCOVERY">Discovery</option>
                <option value="BASELINE">Baseline</option>
                <option value="BACKUP">Backup</option>
                <option value="OBSERVABILITY">Observability</option>
                <option value="FIX_ATTEMPT">Fix Attempt</option>
                <option value="VERIFY">Verify</option>
                <option value="FIXED">Fixed</option>
                <option value="ROLLBACK">Rollback</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
            
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Incidents List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredIncidents.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <li key={incident.id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Incident #{incident.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{incident.triggerType}</span>
                          <span>•</span>
                          <IncidentPriorityBadge priority={incident.priority} size="sm" />
                        </div>
                        <div className="text-xs text-gray-400">
                          Fix attempts: {incident.fixAttempts}/{incident.maxFixAttempts}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <IncidentStatusBadge status={incident.state} />
                      <div className="text-sm text-gray-500">
                        {formatDate(incident.createdAt)}
                      </div>
                      <button 
                        onClick={() => handleViewIncident(incident.id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No incidents found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'All systems are running smoothly.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}