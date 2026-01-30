import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '../AuthGuard';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock LoadingSpinner component
jest.mock('@/components/common/LoadingSpinner', () => ({
  FullScreenLoadingSpinner: ({ message }: { message: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    mockUsePathname.mockReturnValue('/dashboard');
  });

  describe('Loading States', () => {
    it('should show loading spinner when authentication is being checked', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('should render children when user is authenticated on protected route', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: { name: 'USER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated on protected route', async () => {
      mockUsePathname.mockReturnValue('/dashboard');
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('should render children when user is not authenticated on public route', () => {
      mockUsePathname.mockReturnValue('/login');
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      expect(screen.getByText('Login Form')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect authenticated users away from public routes', async () => {
      mockUsePathname.mockReturnValue('/login');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', role: { name: 'USER' } },
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Taking you to the dashboard...')).toBeInTheDocument();
    });

    it('should handle forgot-password route correctly', () => {
      mockUsePathname.mockReturnValue('/forgot-password');
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Forgot Password Form</div>
        </AuthGuard>
      );

      expect(screen.getByText('Forgot Password Form')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle reset-password route correctly', () => {
      mockUsePathname.mockReturnValue('/reset-password');
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <AuthGuard>
          <div>Reset Password Form</div>
        </AuthGuard>
      );

      expect(screen.getByText('Reset Password Form')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});