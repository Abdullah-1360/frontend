'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiClient.post('/auth/password/reset/request', { email });
      setSubmitted(true);
      setMessage({ 
        type: 'success', 
        text: 'If an account with that email exists, we\'ve sent you a password reset link.' 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send reset email. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      
      {/* Floating Elements for Visual Interest */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      <div className="relative max-w-md w-full">
        {/* Main Card with Enhanced Material Design */}
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/5 p-8 relative overflow-hidden">
          {/* Card Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500"></div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-blue-500 to-indigo-600 rounded-3xl shadow-lg shadow-primary/25 mb-6 relative">
              <EnvelopeIcon className="h-10 w-10 text-primary-foreground" />
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Reset your password
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <EnvelopeIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full border-2 border-border rounded-2xl pl-14 pr-4 py-4 text-foreground placeholder-muted-foreground focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm group-hover:border-primary/50"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Error Message */}
              {message && message.type === 'error' && (
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive font-medium">{message.text}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:from-primary/90 hover:to-blue-600/90 focus:ring-4 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center space-x-3 text-base relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-foreground border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-6 w-6" />
                    <span>Send reset link</span>
                  </>
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 hover:underline underline-offset-4"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-success/10 border-2 border-success/20 rounded-2xl p-6 text-center animate-in slide-in-from-top-2 duration-300">
                <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold text-success mb-3">
                  Check your email
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account with that email exists, we've sent you a password reset link. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-muted/50 backdrop-blur-sm rounded-2xl p-5 border border-border/50">
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Security Note</h4>
                    <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                      <li>• The reset link will expire in 1 hour</li>
                      <li>• If you don't receive an email, check your spam folder</li>
                      <li>• For security reasons, we don't confirm if the email exists</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                    setMessage(null);
                  }}
                  className="w-full bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary/90 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 border border-border/50 hover:border-border"
                >
                  Try a different email
                </button>
                <Link 
                  href="/login" 
                  className="text-center text-sm text-primary hover:text-primary/80 font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 hover:underline underline-offset-4"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Secured by WP-AutoHealer • Enterprise WordPress Management
          </p>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0);
          background-size: 24px 24px;
        }
        
        .slide-in-from-top-2 {
          animation: slideInFromTop 0.3s ease-out;
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}