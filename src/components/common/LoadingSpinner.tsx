'use client';

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface LoadingSpinnerProps {
  /** Custom loading message */
  message?: string;
  /** Size variant for the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the full-screen layout */
  fullScreen?: boolean;
  /** Custom icon to display instead of the default shield */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Reusable loading spinner component with consistent styling across WP-AutoHealer.
 * Provides different size variants and can be used inline or as a full-screen overlay.
 * 
 * @param props - The component props
 * @param props.message - Custom loading message to display
 * @param props.size - Size variant (sm, md, lg)
 * @param props.fullScreen - Whether to render as full-screen overlay
 * @param props.icon - Custom icon component to display
 * @returns JSX element containing the loading spinner
 */
export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false,
  icon: Icon = ShieldCheckIcon
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      spinner: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      icon: 'h-8 w-8',
      spinner: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      icon: 'h-12 w-12',
      spinner: 'h-6 w-6',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  const content = (
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <Icon className={`${classes.icon} text-blue-600 animate-pulse`} />
      </div>
      {fullScreen && (
        <h2 className="text-lg font-medium text-gray-900 mb-2">WP-AutoHealer</h2>
      )}
      <div className="flex items-center justify-center space-x-2">
        <div className={`animate-spin rounded-full ${classes.spinner} border-b-2 border-blue-600`}></div>
        <span className={`${classes.text} text-gray-500`}>{message}</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}

/**
 * Inline loading spinner for use within existing layouts
 */
export function InlineLoadingSpinner({ message = 'Loading...', size = 'sm' }: Omit<LoadingSpinnerProps, 'fullScreen'>) {
  return <LoadingSpinner message={message} size={size} fullScreen={false} />;
}

/**
 * Full-screen loading overlay
 */
export function FullScreenLoadingSpinner({ message = 'Loading...', size = 'lg' }: Omit<LoadingSpinnerProps, 'fullScreen'>) {
  return <LoadingSpinner message={message} size={size} fullScreen={true} />;
}