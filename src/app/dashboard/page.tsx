'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications';
import ConnectionStatus from '@/components/status/ConnectionStatus';
import { useIncidentUpdates } from '@/contexts/SSEContext';
import { apiClient } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  ServerIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  activeSites: number;
  activeIncidents: number;
  fixedThisWeek: number;
  successRate: number;
  recentIncidents: Array<{
    id: string;
    site: { domain: string };
    state: string;
    triggerType: string;
    createdAt: string;
    priority: string;
  }>;
  systemHealth: {
    apiServer: 'operational' | 'degraded' | 'down';
    jobEngine: 'processing' | 'idle' | 'error';
    database: 'connected' | 'disconnected';
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {description && (
                <dd className="text-sm text-gray-500">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'ExclamationTriangleIcon':
        return ExclamationTriangleIcon;
      case 'GlobeAltIcon':
        return GlobeAltIcon;
      case 'ServerIcon':
        return ServerIcon;
      case 'DocumentTextIcon':
        return DocumentTextIcon;
      default:
        return PlusIcon;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100';
      case 'blue':
        return 'text-blue-600 bg-blue-50 hover:bg-blue-100';
      case 'green':
        return 'text-green-600 bg-green-50 hover:bg-green-100';
      case 'purple':
        return 'text-purple-600 bg-purple-50 hover:bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-50 hover:bg-gray-100';
    }
  };

  const Icon = getIconComponent(action.icon);
  const colorClasses = getColorClasses(action.color);

  return (
    <a
      href={action.href}
      className={`block p-4 rounded-lg border border-gray-200 transition-colors ${colorClasses}`}
    >
      <div className="flex items-center">
        <Icon className="h-6 w-6 flex-shrink-0" />
        <div className="ml-3">
          <h3 className="text-sm font-medium">{action.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{action.description}</p>
        </div>
      </div>
    </a>
  );
}

function SystemHealthIndicator({ health }: { health: DashboardStats['systemHealth'] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'processing':
        return 'bg-green-400';
      case 'idle':
        return 'bg-yellow-400';
      case 'degraded':
      case 'error':
        return 'bg-red-400';
      case 'down':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (component: string, status: string) => {
    if (component === 'jobEngine' && status === 'idle') {
      return 'Idle';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(health.apiServer)}`}></div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">API Server</p>
          <p className="text-sm text-gray-500">{getStatusText('apiServer', health.apiServer)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(health.jobEngine)}`}></div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Job Engine</p>
          <p className="text-sm text-gray-500">{getStatusText('jobEngine', health.jobEngine)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(health.database)}`}></div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Database</p>
          <p className="text-sm text-gray-500">{getStatusText('database', health.database)}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      const [statsData, actionsData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDashboardQuickActions(),
      ]);
      setStats(statsData);
      setQuickActions(actionsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time incident updates
  const handleIncidentUpdate = useCallback((event: any) => {
    const { data } = event;
    
    // Update stats when incidents change
    setStats(prevStats => {
      if (!prevStats) return prevStats;
      
      const updatedStats = { ...prevStats };
      
      // Update recent incidents list
      if (event.type === 'incident_created') {
        const newIncident = {
          id: data.incidentId,
          site: { domain: data.domain },
          state: data.state,
          triggerType: data.details?.triggerType || 'Unknown',
          createdAt: data.timestamp,
          priority: data.priority
        };
        
        updatedStats.recentIncidents = [newIncident, ...updatedStats.recentIncidents.slice(0, 4)];
        updatedStats.activeIncidents += 1;
      } else if (event.type === 'incident_resolved') {
        updatedStats.activeIncidents = Math.max(0, updatedStats.activeIncidents - 1);
        updatedStats.fixedThisWeek += 1;
        
        // Update the incident in recent incidents list
        updatedStats.recentIncidents = updatedStats.recentIncidents.map(incident => 
          incident.id === data.incidentId 
            ? { ...incident, state: data.state }
            : incident
        );
      } else if (event.type === 'incident_escalated') {
        updatedStats.activeIncidents = Math.max(0, updatedStats.activeIncidents - 1);
        
        // Update the incident in recent incidents list
        updatedStats.recentIncidents = updatedStats.recentIncidents.map(incident => 
          incident.id === data.incidentId 
            ? { ...incident, state: data.state }
            : incident
        );
      } else {
        // General incident update
        updatedStats.recentIncidents = updatedStats.recentIncidents.map(incident => 
          incident.id === data.incidentId 
            ? { ...incident, state: data.state }
            : incident
        );
      }
      
      return updatedStats;
    });
    
    setLastUpdated(new Date());
  }, []);

  useIncidentUpdates(handleIncidentUpdate);

  useEffect(() => {
    fetchDashboardData();

    // Set up periodic refresh (less frequent since we have real-time updates)
    const interval = setInterval(fetchDashboardData, 60000); // Every minute instead of 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RealTimeNotifications />
      <div className="space-y-6">
        {/* Page Header with Refresh Button and Connection Status */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="mt-1 flex items-center space-x-4">
              <p className="text-sm text-gray-500">
                System overview and key metrics
                {lastUpdated && (
                  <span className="ml-2">
                    • Last updated {formatDate(lastUpdated.toISOString())}
                  </span>
                )}
              </p>
              <ConnectionStatus />
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Sites"
            value={stats?.activeSites || 0}
            icon={GlobeAltIcon}
            color="text-blue-600"
            description="WordPress sites monitored"
          />
          <StatCard
            title="Active Incidents"
            value={stats?.activeIncidents || 0}
            icon={ExclamationTriangleIcon}
            color="text-yellow-600"
            description="Currently being processed"
          />
          <StatCard
            title="Fixed This Week"
            value={stats?.fixedThisWeek || 0}
            icon={CheckCircleIcon}
            color="text-green-600"
            description="Successfully resolved"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            icon={ChartBarIcon}
            color="text-purple-600"
            description="Last 30 days"
          />
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Common tasks and operations
              </p>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Incidents
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest incident activity and status updates
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {stats?.recentIncidents?.length ? (
              stats.recentIncidents.map((incident) => (
                <li key={incident.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {incident.site.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incident.triggerType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          incident.state
                        )}`}
                      >
                        {incident.state.replace('_', ' ')}
                      </span>
                      <div className="text-sm text-gray-500">
                        {formatDate(incident.createdAt)}
                      </div>
                      <a
                        href={`/incidents/${incident.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-8 text-center">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No recent incidents
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All systems are running smoothly.
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* System Status */}
        {stats?.systemHealth && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                System Status
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Current system health and performance metrics
              </p>
            </div>
            <div className="px-4 py-4">
              <SystemHealthIndicator health={stats.systemHealth} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}