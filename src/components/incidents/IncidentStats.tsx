import React from 'react';
import { Incident } from '@/lib/api';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

interface IncidentStatsProps {
  incidents: Incident[];
}

export default function IncidentStats({ incidents }: IncidentStatsProps) {
  const stats = {
    total: incidents.length,
    active: incidents.filter(i => !['FIXED', 'ESCALATED'].includes(i.state)).length,
    fixed: incidents.filter(i => i.state === 'FIXED').length,
    escalated: incidents.filter(i => i.state === 'ESCALATED').length,
    critical: incidents.filter(i => i.priority === 'CRITICAL').length,
  };

  const statItems = [
    {
      name: 'Total Incidents',
      value: stats.total,
      icon: ExclamationTriangleIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      name: 'Active',
      value: stats.active,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Fixed',
      value: stats.fixed,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Critical Priority',
      value: stats.critical,
      icon: FireIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${item.bgColor}`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{item.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}