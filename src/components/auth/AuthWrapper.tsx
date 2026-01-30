'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { loading } = useAuth();

  // Show loading spinner while checking authentication
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
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render children once authentication check is complete
  return <>{children}</>;
}