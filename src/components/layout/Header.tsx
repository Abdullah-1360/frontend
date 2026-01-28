'use client';

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">WP-AutoHealer</h1>
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}