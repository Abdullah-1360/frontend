'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface SSEEvent {
  id?: string;
  type: string;
  data: any;
  retry?: number;
}

export interface SSEOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export interface SSEState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEvent: SSEEvent | null;
  reconnectAttempts: number;
}

export function useSSE(options: SSEOptions = {}) {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    debug = false
  } = options;

  const [state, setState] = useState<SSEState>({
    connected: false,
    connecting: false,
    error: null,
    lastEvent: null,
    reconnectAttempts: 0
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<string, ((event: SSEEvent) => void)[]>>(new Map());
  const connectionIdRef = useRef<string | null>(null);

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }, [debug]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      log('Already connected');
      return;
    }

    // Get auth token first
    const token = apiClient.getToken();
    if (!token) {
      log('No authentication token available, skipping connection');
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: 'No authentication token available'
      }));
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));
    log('Connecting to SSE...');

    try {
      // Generate connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connectionIdRef.current = connectionId;

      // Create EventSource with auth header (using query param since EventSource doesn't support custom headers)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const url = `${baseUrl}/sse/events?connectionId=${connectionId}&token=${encodeURIComponent(token)}`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        log('SSE connection opened');
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0
        }));
      };

      eventSource.onerror = (error) => {
        log('SSE connection error:', error);
        
        // Use setState callback to get current reconnectAttempts
        setState(prev => {
          const currentAttempts = prev.reconnectAttempts;
          
          // Attempt reconnection
          if (currentAttempts < maxReconnectAttempts) {
            log(`Reconnecting in ${reconnectInterval}ms (attempt ${currentAttempts + 1}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              setState(p => ({ ...p, reconnectAttempts: p.reconnectAttempts + 1 }));
              connect();
            }, reconnectInterval);
            
            return {
              ...prev,
              connected: false,
              connecting: false,
              error: 'Connection error'
            };
          } else {
            log('Max reconnection attempts reached');
            return {
              ...prev,
              connected: false,
              connecting: false,
              error: 'Max reconnection attempts reached'
            };
          }
        });
      };

      // Handle specific event types
      eventSource.addEventListener('connection_established', (event) => {
        log('Connection established:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'connection_established',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('connection_established', sseEvent);
      });

      eventSource.addEventListener('incident_created', (event) => {
        log('Incident created:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'incident_created',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('incident_created', sseEvent);
        notifyListeners('incident_update', sseEvent); // Also notify general incident listeners
      });

      eventSource.addEventListener('incident_update', (event) => {
        log('Incident updated:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'incident_update',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('incident_update', sseEvent);
      });

      eventSource.addEventListener('incident_resolved', (event) => {
        log('Incident resolved:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'incident_resolved',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('incident_resolved', sseEvent);
        notifyListeners('incident_update', sseEvent); // Also notify general incident listeners
      });

      eventSource.addEventListener('incident_escalated', (event) => {
        log('Incident escalated:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'incident_escalated',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('incident_escalated', sseEvent);
        notifyListeners('incident_update', sseEvent); // Also notify general incident listeners
      });

      eventSource.addEventListener('system_status', (event) => {
        log('System status update:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'system_status',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('system_status', sseEvent);
      });

      eventSource.addEventListener('site_health', (event) => {
        log('Site health update:', event.data);
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'site_health',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('site_health', sseEvent);
      });

      eventSource.addEventListener('heartbeat', (event) => {
        log('Heartbeat received');
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          id: event.lastEventId,
          type: 'heartbeat',
          data
        };
        setState(prev => ({ ...prev, lastEvent: sseEvent }));
        notifyListeners('heartbeat', sseEvent);
      });

    } catch (error) {
      log('Error creating SSE connection:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [maxReconnectAttempts, reconnectInterval, log]);

  const disconnect = useCallback(() => {
    log('Disconnecting SSE...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0
    }));
  }, [log]);

  const addEventListener = useCallback((eventType: string, listener: (event: SSEEvent) => void) => {
    const listeners = eventListenersRef.current.get(eventType) || [];
    listeners.push(listener);
    eventListenersRef.current.set(eventType, listeners);

    // Return cleanup function
    return () => {
      const currentListeners = eventListenersRef.current.get(eventType) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        if (currentListeners.length === 0) {
          eventListenersRef.current.delete(eventType);
        } else {
          eventListenersRef.current.set(eventType, currentListeners);
        }
      }
    };
  }, []);

  const notifyListeners = useCallback((eventType: string, event: SSEEvent) => {
    const listeners = eventListenersRef.current.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in SSE event listener for ${eventType}:`, error);
      }
    });
  }, []);

  // Cleanup on unmount only - don't auto-connect
  // Connection should be managed by SSEContext based on auth state
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    addEventListener
  };
}