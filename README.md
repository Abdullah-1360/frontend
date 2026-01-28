# WP-AutoHealer Frontend

This is the Next.js frontend application for the WP-AutoHealer control panel.

## Features

- **Modern Next.js App Router**: Built with Next.js 16+ using the App Router for optimal performance
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Responsive design with a professional UI component system
- **Authentication**: JWT-based authentication with MFA support
- **Real-time Updates**: Ready for Server-Sent Events integration
- **Role-Based Access Control**: UI adapts based on user permissions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running WP-AutoHealer backend API

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── incidents/         # Incidents management
│   ├── login/            # Authentication
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
│   └── layout/          # Layout components
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/                 # Utilities and configurations
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
└── middleware.ts       # Next.js middleware for route protection
```

## Key Components

### Authentication
- JWT-based authentication with automatic token management
- MFA support with TOTP integration
- Protected routes with automatic redirects
- Role-based access control

### Layout System
- Responsive header with user menu
- Collapsible sidebar navigation
- Professional dashboard layout
- Mobile-friendly design

### API Integration
- Type-safe API client with Axios
- Automatic token injection
- Error handling and retry logic
- Request/response interceptors

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `WP-AutoHealer` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` |

## Features Implemented

### ✅ Core Infrastructure
- [x] Next.js with App Router setup
- [x] TypeScript configuration
- [x] Tailwind CSS styling system
- [x] Professional layout structure
- [x] API client with authentication
- [x] Route protection middleware

### ✅ Authentication System
- [x] Login page with MFA support
- [x] JWT token management
- [x] Protected routes
- [x] User context and state management

### ✅ Dashboard Interface
- [x] System overview dashboard
- [x] Key metrics display
- [x] Recent incidents list
- [x] System status indicators

### ✅ Navigation & Layout
- [x] Responsive sidebar navigation
- [x] Professional header with user menu
- [x] Mobile-friendly design
- [x] Consistent layout system

## Next Steps

The following features are ready for implementation:

1. **Incident Management**: Detailed incident views with timeline
2. **Site Management**: WordPress site configuration and monitoring
3. **Server Management**: Server connection and status management
4. **User Management**: User and role administration
5. **Settings**: System configuration and retention policies
6. **Real-time Updates**: Server-Sent Events integration
7. **Audit Logs**: Comprehensive audit trail interface

## Design System

The application uses a professional design system with:

- **Colors**: Blue primary, semantic colors for status indicators
- **Typography**: Inter font family for readability
- **Spacing**: Consistent 4px grid system
- **Components**: Reusable UI components with proper accessibility
- **Icons**: Heroicons for consistent iconography

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Ensure responsive design for all components
4. Add proper error handling and loading states
5. Test authentication flows thoroughly

## License

This project is part of the WP-AutoHealer system and follows the same licensing terms.