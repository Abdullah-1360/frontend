'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

/**
 * Page-level protection component for WP-AutoHealer
 * Provides role-based access control with loading states
 */
export default function ProtectedPage({ 
  children, 
  allowedRoles = [],
  fallback 
}: ProtectedPageProps) {
  const { loading, isAuthenticated, hasRequiredRole } = useAuthGuard({
    requireAuth: true,
    allowedRoles
  });

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">WP-AutoHealer</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Verifying access...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show fallback or error if not authenticated or insufficient permissions
  if (!isAuthenticated || !hasRequiredRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}