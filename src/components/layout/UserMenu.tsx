'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Info Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="h-6 w-6 text-gray-500" />
          <div className="text-left">
            <div className="text-sm font-medium text-gray-700">
              {user?.email}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role?.name?.replace('_', ' ')}
            </div>
          </div>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.name?.replace('_', ' ')}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    {user?.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                Profile Settings
              </Link>
              
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
                System Settings
              </Link>
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}