import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function formatDuration(startTime: Date | string, endTime?: Date | string): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = endTime ? (typeof endTime === 'string' ? new Date(endTime) : endTime) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffSeconds = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds}s`;
  }
  return `${diffSeconds}s`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'fixed':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'escalated':
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'new':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}