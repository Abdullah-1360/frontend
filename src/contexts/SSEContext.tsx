'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSSE, SSEEvent, SSEState } from '@/hooks/useSSE';
import { useAuth } from './AuthContext';

interface SSEContextType extends SSEState {
  addEventListener: (eventType: string, listener: (event: SSEEvent) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const SSEContext = createContext<SSEContextType | null>(null);

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const sse = useSSE({ debug: process.env.NODE_ENV === 'development' });

  // Only connect when user is authenticated and auth check is complete
  useEffect(() => {
    if (loading) {
      // Don't attempt connection while auth is loading
      return;
    }

    if (user) {
      sse.connect();
    } else {
      sse.disconnect();
    }
  }, [user, loading, sse.connect, sse.disconnect]);

  return (
    <SSEContext.Provider value={sse}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSEContext() {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
}

// Convenience hooks for specific event types
export function useIncidentUpdates(callback: (event: SSEEvent) => void) {
  const sse = useSSEContext();
  
  useEffect(() => {
    const cleanup = sse.addEventListener('incident_update', callback);
    return cleanup;
  }, [sse, callback]);
}

export function useSystemStatus(callback: (event: SSEEvent) => void) {
  const sse = useSSEContext();
  
  useEffect(() => {
    const cleanup = sse.addEventListener('system_status', callback);
    return cleanup;
  }, [sse, callback]);
}

export function useSiteHealth(callback: (event: SSEEvent) => void) {
  const sse = useSSEContext();
  
  useEffect(() => {
    const cleanup = sse.addEventListener('site_health', callback);
    return cleanup;
  }, [sse, callback]);
}