# AuthGuard Component

The `AuthGuard` component provides authentication protection for routes in the WP-AutoHealer frontend application. It handles automatic routing based on authentication state and current pathname using Next.js App Router.

## Features

- **Automatic Route Protection**: Intelligently protects routes based on authentication state
- **Smart Redirects**: Handles redirects for both authenticated and unauthenticated users
- **Loading States**: Consistent loading UI with WP-AutoHealer branding during authentication checks
- **Public Route Detection**: Automatically identifies public routes that don't require authentication
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Next.js App Router Compatible**: Uses `useRouter` and `usePathname` from Next.js 14+

## Basic Usage

### Protect All Routes (Default Behavior)

The AuthGuard automatically determines route protection based on the current pathname:

```tsx
import AuthGuard from '@/components/auth/AuthGuard';

export default function App() {
  return (
    <AuthGuard>
      {/* All routes are automatically protected except public routes */}
      <YourAppContent />
    </AuthGuard>
  );
}
```

### Public Routes

The following routes are automatically treated as public (no authentication required):
- `/login`
- `/forgot-password` 
- `/reset-password`

All other routes require authentication and will redirect unauthenticated users to `/login`.

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Content to render when authentication state is appropriate for the current route |

## Route Behavior

### Protected Routes (Default)
- **Authenticated users**: Content is rendered
- **Unauthenticated users**: Redirected to `/login`

### Public Routes
- **Authenticated users**: Redirected to `/dashboard`
- **Unauthenticated users**: Content is rendered

## Loading States

The component shows a consistent loading spinner with the WP-AutoHealer branding while checking authentication status.

## Layout Integration

### App Router Layout

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Testing

The component includes comprehensive tests covering:
- Authentication states
- Route-based behavior
- Loading states
- Public vs protected routes

Run tests with:
```bash
npm test AuthGuard
```

## Best Practices

1. **Use at Root Level**: Apply AuthGuard at the root layout level to protect the entire application
2. **Monitor Authentication State**: The component automatically handles all authentication routing
3. **Test Different Routes**: Test with different pathnames to ensure proper routing behavior

This component provides robust, secure, and user-friendly authentication routing for the WP-AutoHealer application while maintaining consistency with the overall design system.