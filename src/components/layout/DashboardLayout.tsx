'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AuthWrapper from '@/components/auth/AuthWrapper';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthWrapper>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Header />
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}