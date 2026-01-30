'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

/**
 * Custom hook for page-level authentication guards
 * Provides more flexibility than a global AuthGuard component
 * 
 * @param options - Configuration options for the auth guard
 * @returns Authentication state and loading status
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const {
    redirectTo = '/login',
    requireAuth = true,
    allowedRoles = []
  } = options;
  
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      console.warn(`[AuthGuard] Unauthorized access attempt to ${pathname}`);
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (isAuthenticated && allowedRoles.length > 0 && user) {
      const userRole = user.role?.name;
      if (!userRole || !allowedRoles.includes(userRole)) {
        console.warn(`[AuthGuard] Insufficient permissions for ${pathname}. Required: ${allowedRoles.join(', ')}, User has: ${userRole}`);
        router.push('/dashboard'); // Redirect to safe page
        return;
      }
    }
  }, [loading, isAuthenticated, user, requireAuth, allowedRoles, pathname, router, redirectTo]);

  return {
    isAuthenticated,
    user,
    loading,
    hasRequiredRole: allowedRoles.length === 0 || (user && allowedRoles.includes(user.role?.name || ''))
  };
}

/**
 * Hook for public pages that should redirect authenticated users
 */
export function usePublicRoute(redirectTo: string = '/dashboard') {
  return useAuthGuard({
    requireAuth: false,
    redirectTo
  });
}

/**
 * Hook for admin-only pages
 */
export function useAdminGuard() {
  return useAuthGuard({
    requireAuth: true,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN']
  });
}

/**
 * Hook for engineer-level access
 */
export function useEngineerGuard() {
  return useAuthGuard({
    requireAuth: true,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ENGINEER']
  });
}