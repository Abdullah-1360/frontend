'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, LoginRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ 
    success: boolean; 
    requiresMfa?: boolean; 
    error?: string;
    isLocked?: boolean;
    lockoutUntil?: string;
  }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      console.log('[AuthContext] Starting authentication check...');
      
      try {
        // Check multiple token sources for better persistence
        const token = apiClient.getToken();
        console.log('[AuthContext] Token found:', !!token);
        
        if (!token) {
          console.log('[AuthContext] No token found, user not authenticated');
          setLoading(false);
          return;
        }

        // Validate token expiry if available
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < currentTime) {
            console.log('[AuthContext] Token expired, clearing...');
            apiClient.clearToken();
            setUser(null);
            setLoading(false);
            return;
          }
          
          console.log('[AuthContext] Token valid, expires at:', new Date(payload.exp * 1000));
        } catch (e) {
          console.warn('[AuthContext] Could not parse token expiry, proceeding with API check');
        }

        // If we have a valid token, try to get current user
        console.log('[AuthContext] Fetching current user...');
        const currentUser = await apiClient.getCurrentUser();
        
        if (!currentUser || !currentUser.email) {
          console.log('[AuthContext] Invalid user data received, clearing token');
          apiClient.clearToken();
          setUser(null);
          setLoading(false);
          return;
        }
        
        setUser(currentUser);
        console.log('[AuthContext] User authenticated successfully:', currentUser?.email || 'No email found');
      } catch (error: any) {
        // User is not authenticated or token is invalid
        console.log('[AuthContext] Authentication failed:', error.message);
        apiClient.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
        console.log('[AuthContext] Authentication check complete');
      }
    };

    checkAuth();
  }, []); // Remove dependency to run only once on mount

  const login = async (credentials: LoginRequest) => {
    try {
      console.log('[AuthContext] Attempting login...');
      const response = await apiClient.login(credentials);
      console.log('[AuthContext] Login response:', response);
      
      if (response.requiresMfa) {
        console.log('[AuthContext] MFA required');
        return { success: false, requiresMfa: true };
      }
      
      console.log('[AuthContext] Setting user:', response.user);
      setUser(response.user);
      console.log('[AuthContext] Login successful');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      
      // Handle account lockout specifically
      if (error.response?.status === 423) {
        const lockoutData = error.response?.data;
        const lockoutUntil = lockoutData?.lockoutUntil;
        let errorMessage = 'Account is locked due to too many failed login attempts.';
        
        if (lockoutUntil) {
          const unlockTime = new Date(lockoutUntil);
          const now = new Date();
          const minutesRemaining = Math.ceil((unlockTime.getTime() - now.getTime()) / (1000 * 60));
          
          if (minutesRemaining > 0) {
            errorMessage += ` Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
          } else {
            errorMessage += ' Please try again.';
          }
        }
        
        return { success: false, error: errorMessage, isLocked: true, lockoutUntil };
      }
      
      const errorMessage = error.response?.data?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      apiClient.clearToken();
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}