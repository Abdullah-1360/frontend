'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ServerConfigForm from '@/components/servers/ServerConfigForm';
import ServerDetailsModal from '@/components/servers/ServerDetailsModal';
import { apiClient, Server } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ServerIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CogIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  KeyIcon,
  LockClosedIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface ConnectionStatus {
  [serverId: string]: {
    status: 'connected' | 'disconnected' | 'testing' | 'unknown';
    lastTested?: string;
    message?: string;
  };
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await apiClient.getServers();
        setServers(data.servers);
        
        // Initialize connection status
        const initialStatus: ConnectionStatus = {};
        data.servers.forEach(server => {
          initialStatus[server.id] = { status: 'unknown' };
        });
        setConnectionStatus(initialStatus);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load servers');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const testConnection = async (serverId: string) => {
    setConnectionStatus(prev => ({
      ...prev,
      [serverId]: { ...prev[serverId], status: 'testing' }
    }));

    try {
      const result = await apiClient.testServerConnection(serverId);
      setConnectionStatus(prev => ({
        ...prev,
        [serverId]: {
          status: result.success ? 'connected' : 'disconnected',
          lastTested: new Date().toISOString(),
          message: result.message
        }
      }));
    } catch (err: any) {
      setConnectionStatus(prev => ({
        ...prev,
        [serverId]: {
          status: 'disconnected',
          lastTested: new Date().toISOString(),
          message: err.response?.data?.message || 'Connection failed'
        }
      }));
    }
  };

  const handleServerSave = (savedServer: Server) => {
    if (editingServer) {
      // Update existing server
      setServers(prev => prev.map(server => server.id === savedServer.id ? savedServer : server));
    } else {
      // Add new server
      setServers(prev => [...prev, savedServer]);
    }
    setEditingServer(null);
  };

  const getConnectionStatusDisplay = (serverId: string) => {
    const status = connectionStatus[serverId];
    if (!status) return { icon: ClockIcon, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };

    switch (status.status) {
      case 'connected':
        return { icon: CheckCircleIcon, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Connected' };
      case 'disconnected':
        return { icon: ExclamationCircleIcon, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Disconnected' };
      case 'testing':
        return { icon: ArrowPathIcon, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Testing...' };
      default:
        return { icon: ClockIcon, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const getControlPanelIcon = (controlPanel?: string) => {
    if (!controlPanel) return ComputerDesktopIcon;
    
    switch (controlPanel.toLowerCase()) {
      case 'cpanel':
      case 'plesk':
      case 'directadmin':
      case 'cyberpanel':
        return CogIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.hostname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Servers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage server connections and monitor their status
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Server
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
            placeholder="Search servers..."
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

        {/* Servers Grid */}
        {filteredServers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServers.map((server) => {
              const statusDisplay = getConnectionStatusDisplay(server.id);
              const ControlPanelIcon = getControlPanelIcon(server.controlPanel);
              const status = connectionStatus[server.id];
              
              return (
                <div
                  key={server.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border-l-4"
                  style={{ 
                    borderLeftColor: statusDisplay.color.includes('green') ? '#10b981' : 
                                   statusDisplay.color.includes('red') ? '#ef4444' : 
                                   statusDisplay.color.includes('blue') ? '#3b82f6' : '#6b7280' 
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ServerIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {server.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {server.hostname}:{server.port}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                          <statusDisplay.icon className="h-3 w-3 mr-1" />
                          {statusDisplay.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Username:</span>
                        <span className="text-gray-900 font-medium">{server.username}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Auth Type:</span>
                        <div className="flex items-center">
                          {server.authType === 'key' ? (
                            <KeyIcon className="h-4 w-4 text-green-600 mr-1" />
                          ) : (
                            <LockClosedIcon className="h-4 w-4 text-blue-600 mr-1" />
                          )}
                          <span className="text-gray-900 capitalize">{server.authType}</span>
                        </div>
                      </div>
                      {server.controlPanel && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Control Panel:</span>
                          <div className="flex items-center">
                            <ControlPanelIcon className="h-4 w-4 text-purple-600 mr-1" />
                            <span className="text-gray-900 capitalize">{server.controlPanel}</span>
                          </div>
                        </div>
                      )}
                      {server.osInfo && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">OS:</span>
                          <span className="text-gray-900">{server.osInfo.name || 'Linux'}</span>
                        </div>
                      )}
                    </div>

                    {status?.lastTested && (
                      <div className="mt-4 text-xs text-gray-500 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Last tested: {formatDate(status.lastTested)}
                      </div>
                    )}

                    {status?.message && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {status.message}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => testConnection(server.id)}
                          disabled={status?.status === 'testing'}
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                        >
                          <ArrowPathIcon className={`h-4 w-4 mr-1 ${status?.status === 'testing' ? 'animate-spin' : ''}`} />
                          Test Connection
                        </button>
                        <button 
                          onClick={() => setSelectedServer(server)}
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Details
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setEditingServer(server)}
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
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No servers found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first server connection.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add your first server
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Server Configuration Modal */}
      <ServerConfigForm
        server={editingServer || undefined}
        isOpen={showAddModal || editingServer !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingServer(null);
        }}
        onSave={handleServerSave}
      />

      {/* Server Details Modal */}
      <ServerDetailsModal
        server={selectedServer}
        connectionStatus={selectedServer ? connectionStatus[selectedServer.id] : undefined}
        isOpen={selectedServer !== null && !editingServer}
        onClose={() => setSelectedServer(null)}
      />
    </DashboardLayout>
  );
}