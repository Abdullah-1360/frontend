import React from 'react';

interface IncidentPriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  size?: 'sm' | 'md' | 'lg';
}

export default function IncidentPriorityBadge({ priority, size = 'md' }: IncidentPriorityBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-0.5 text-sm',
  };

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${priorityColors[priority]} ${sizeClasses[size]}`}
    >
      {priority}
    </span>
  );
}