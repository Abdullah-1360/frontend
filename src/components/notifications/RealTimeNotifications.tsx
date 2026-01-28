'use client';

import React, { useState, useEffect } from 'react';
import { useSSEContext, useIncidentUpdates } from '@/contexts/SSEContext';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const sse = useSSEContext();

  // Handle incident updates
  useIncidentUpdates((event) => {
    const { data } = event;
    let notification: Notification;

    switch (event.type) {
      case 'incident_created':
        notification = {
          id: `incident_${data.incidentId}_${Date.now()}`,
          type: 'warning',
          title: 'New Incident Created',
          message: `Incident detected on ${data.domain} - ${data.step}`,
          timestamp: new Date(),
          autoHide: true
        };
        break;

      case 'incident_resolved':
        notification = {
          id: `incident_${data.incidentId}_${Date.now()}`,
          type: 'success',
          title: 'Incident Resolved',
          message: `${data.domain} has been successfully fixed after ${data.fixAttempts} attempts`,
          timestamp: new Date(),
          autoHide: true
        };
        break;

      case 'incident_escalated':
        notification = {
          id: `incident_${data.incidentId}_${Date.now()}`,
          type: 'error',
          title: 'Incident Escalated',
          message: `${data.domain} requires manual intervention - ${data.details?.escalationReason || 'Max attempts reached'}`,
          timestamp: new Date(),
          autoHide: false
        };
        break;

      default:
        notification = {
          id: `incident_${data.incidentId}_${Date.now()}`,
          type: 'info',
          title: 'Incident Update',
          message: `${data.domain} - ${data.step}`,
          timestamp: new Date(),
          autoHide: true
        };
    }

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep max 10 notifications
  });

  // Handle connection status
  useEffect(() => {
    const cleanup = sse.addEventListener('connection_established', (event) => {
      const notification: Notification = {
        id: `connection_${Date.now()}`,
        type: 'success',
        title: 'Real-time Updates Connected',
        message: 'You will now receive live updates for incidents and system status',
        timestamp: new Date(),
        autoHide: true
      };
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    return cleanup;
  }, [sse]);

  // Auto-hide notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(notification => {
          if (!notification.autoHide) return true;
          const age = Date.now() - notification.timestamp.getTime();
          return age < 5000; // Hide after 5 seconds
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 shadow-lg transition-all duration-300 ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}