'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ServerIcon,
  DocumentTextIcon,
  LinkIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredRoles?: string[]; // Optional: if specified, only these roles can see this item
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    description: 'System overview and metrics',
  },
  {
    name: 'Incidents',
    href: '/incidents',
    icon: ExclamationTriangleIcon,
    description: 'Active and resolved incidents',
  },
  {
    name: 'Sites',
    href: '/sites',
    icon: GlobeAltIcon,
    description: 'WordPress sites management',
  },
  {
    name: 'Servers',
    href: '/servers',
    icon: ServerIcon,
    description: 'Server connections and status',
  },
  {
    name: 'Policies',
    href: '/policies',
    icon: DocumentTextIcon,
    description: 'System policies and configuration',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can manage policies
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: LinkIcon,
    description: 'External system integrations',
  },
  {
    name: 'Users & Roles',
    href: '/users',
    icon: UsersIcon,
    description: 'User management and permissions',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can manage users
  },
  {
    name: 'Audit Log',
    href: '/audit',
    icon: ClipboardDocumentListIcon,
    description: 'System audit trail',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can view audit logs
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'System configuration',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can change settings
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    // If no required roles specified, show to everyone
    if (!item.requiredRoles) {
      return true;
    }
    
    // If user is not logged in, hide restricted items
    if (!user) {
      return false;
    }
    
    // Check if user's role is in the required roles
    return item.requiredRoles.includes(user.role?.name || '');
  });

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className={cn(
                    'text-xs',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}