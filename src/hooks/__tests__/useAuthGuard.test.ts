import { renderHook, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard, useAdminGuard, useEngineerGuard } from '../useAuthGuard';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    mockUsePathname.mockReturnValue('/dashboard');
  });

  describe('Authentication Requirements', () => {
    it('should redirect unauthenticated users when auth is required', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderHook(() => useAuthGuard({ requireAuth: true }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should not redirect when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: { name: 'USER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useAuthGuard({ requireAuth: true }));

      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: { name: 'ADMIN' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => 
        useAuthGuard({ requireAuth: true, allowedRoles: ['ADMIN'] })
      );

      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.hasRequiredRole).toBe(true);
    });

    it('should redirect when user lacks required role', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: { name: 'USER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderHook(() => 
        useAuthGuard({ requireAuth: true, allowedRoles: ['ADMIN'] })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Specialized Guards', () => {
    it('useAdminGuard should require admin roles', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: { name: 'USER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderHook(() => useAdminGuard());

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('useEngineerGuard should allow engineer access', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'engineer@example.com', role: { name: 'ENGINEER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useEngineerGuard());

      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.hasRequiredRole).toBe(true);
    });
  });
});