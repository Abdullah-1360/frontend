// Health check endpoint for frontend
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - can be extended with more comprehensive checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'wp-autohealer-frontend',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'wp-autohealer-frontend',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}