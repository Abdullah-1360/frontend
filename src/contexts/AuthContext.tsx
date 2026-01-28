'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, LoginRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; requiresMfa?: boolean; error?: string }>;
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
      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // User is not authenticated or token is invalid
        apiClient.clearToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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