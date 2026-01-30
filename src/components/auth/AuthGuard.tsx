'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/verify-email',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/forgot-password'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    console.log('[AuthGuard] Route check:', {
      pathname,
      isPublicRoute,
      isAuthRoute,
      isAuthenticated,
      loading
    });

    // If user is authenticated and on an auth route, redirect to dashboard
    if (isAuthenticated && isAuthRoute) {
      console.log('[AuthGuard] Authenticated user on auth route, redirecting to dashboard');
      router.replace('/dashboard');
      return;
    }

    // If user is not authenticated and on a protected route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      console.log('[AuthGuard] Unauthenticated user on protected route, redirecting to login');
      router.replace('/login');
      return;
    }
  }, [loading, isAuthenticated, pathname, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">WP-AutoHealer</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Show loading for redirect scenarios to prevent flash
  if (isAuthenticated && isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <span className="text-sm text-muted-foreground">Redirecting...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <span className="text-sm text-muted-foreground">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Render children for valid routes
  return <>{children}</>;
}