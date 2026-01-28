'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await apiClient.verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 3000);
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Verification failed';
        if (errorMessage.includes('expired')) {
          setStatus('expired');
          setMessage('Your verification link has expired');
          setCanResend(true);
        } else if (errorMessage.includes('already verified')) {
          setStatus('success');
          setMessage('Your email is already verified');
        } else {
          setStatus('error');
          setMessage('Invalid verification link');
        }
      } else {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    try {
      await apiClient.resendEmailVerification(resendEmail);
      setMessage('Verification email sent! Please check your inbox.');
      setCanResend(false);
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <ArrowPathIcon className="h-16 w-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-success" />;
      case 'error':
      case 'expired':
        return <ExclamationCircleIcon className="h-16 w-16 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'error':
      case 'expired':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative max-w-md w-full">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/5 p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'expired' && 'Link Expired'}
          </h1>

          {/* Message */}
          <p className={`text-base mb-6 ${getStatusColor()}`}>
            {message}
          </p>

          {/* Success Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting to login page in 3 seconds...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Continue to Login
              </Link>
            </div>
          )}

          {/* Resend Form */}
          {canResend && (
            <div className="space-y-4">
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Resend Verification Email
                </h3>
                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-md placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resending || !resendEmail}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                  >
                    {resending ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Back to Login */}
          {(status === 'error' || status === 'expired') && !canResend && (
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors duration-200"
            >
              Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}