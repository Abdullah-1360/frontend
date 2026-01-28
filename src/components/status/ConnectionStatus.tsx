'use client';

import React from 'react';
import { useSSEContext } from '@/contexts/SSEContext';
import { 
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function ConnectionStatus() {
  const { connected, connecting, error, reconnectAttempts, connect } = useSSEContext();

  const getStatusColor = () => {
    if (connected) return 'text-green-500';
    if (connecting) return 'text-yellow-500';
    if (error) return 'text-red-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (connected) return 'Real-time updates active';
    if (connecting) return 'Connecting...';
    if (error) return `Connection error${reconnectAttempts > 0 ? ` (attempt ${reconnectAttempts})` : ''}`;
    return 'Disconnected';
  };

  const getIcon = () => {
    if (connected) {
      return <WifiIcon className={`h-4 w-4 ${getStatusColor()}`} />;
    }
    if (connecting) {
      return <ArrowPathIcon className={`h-4 w-4 ${getStatusColor()} animate-spin`} />;
    }
    if (error) {
      return <ExclamationTriangleIcon className={`h-4 w-4 ${getStatusColor()}`} />;
    }
    return <WifiIcon className={`h-4 w-4 ${getStatusColor()}`} />;
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {error && (
        <button
          onClick={connect}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}