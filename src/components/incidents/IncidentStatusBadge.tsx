import React from 'react';
import { getStatusColor } from '@/lib/utils';

interface IncidentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function IncidentStatusBadge({ status, size = 'md' }: IncidentStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-0.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}