import React from 'react';
import { IncidentEvent } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface IncidentTimelineProps {
  events: IncidentEvent[];
}

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
  const getEventIcon = (eventType: string, phase: string) => {
    switch (eventType.toLowerCase()) {
      case 'success':
      case 'completed':
        return CheckCircleIcon;
      case 'error':
      case 'failed':
        return ExclamationCircleIcon;
      case 'info':
      case 'started':
        return InformationCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getEventColor = (eventType: string, phase: string) => {
    switch (eventType.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-500';
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline events</h3>
        <p className="mt-1 text-sm text-gray-500">Timeline events will appear here as the incident progresses.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => {
          const Icon = getEventIcon(event.eventType, event.phase);
          const iconColor = getEventColor(event.eventType, event.phase);
          
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full ${iconColor} flex items-center justify-center ring-8 ring-white`}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.step}</p>
                      <p className="text-sm text-gray-500">
                        Phase: <span className="font-medium">{event.phase}</span> • Type: <span className="font-medium">{event.eventType}</span>
                      </p>
                      {event.data && Object.keys(event.data).length > 0 && (
                        <div className="mt-2">
                          <details className="group">
                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                              View event data
                            </summary>
                            <div className="mt-2 text-sm text-gray-600">
                              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                      {event.duration && (
                        <div className="text-xs text-gray-400">
                          Duration: {event.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}