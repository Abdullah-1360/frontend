'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-blue-600 animate-pulse" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">WP-AutoHealer</h2>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
