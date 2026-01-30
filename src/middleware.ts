import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/verify-email',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and other Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get token from cookies (most reliable for SSR)
  const token = request.cookies.get('auth_token')?.value;
  const hasToken = !!token;

  console.log('[Middleware]', {
    pathname,
    hasToken,
    isPublicRoute: PUBLIC_ROUTES.some(route => pathname.startsWith(route)),
    isAuthRoute: AUTH_ROUTES.some(route => pathname.startsWith(route))
  });

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // If user has token and is on auth route, redirect to dashboard
  if (hasToken && isAuthRoute) {
    console.log('[Middleware] Authenticated user on auth route, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user has no token and is on protected route, redirect to login
  if (!hasToken && !isPublicRoute) {
    console.log('[Middleware] Unauthenticated user on protected route, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};