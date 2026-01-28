'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShieldCheckIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  KeyIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password, mfaToken: mfaToken || undefined });
      
      if (result.success) {
        router.push('/dashboard');
      } else if (result.requiresMfa) {
        setShowMfa(true);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
              <ShieldCheckIcon className="h-10 w-10 text-primary-foreground" />
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Sign in to your WP-AutoHealer control panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                Email address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full border-2 border-border rounded-2xl px-4 py-4 text-foreground placeholder-muted-foreground focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm group-hover:border-primary/50"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full border-2 border-border rounded-2xl px-4 py-4 pr-14 text-foreground placeholder-muted-foreground focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm group-hover:border-primary/50"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors duration-200 z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* MFA Field */}
            {showMfa && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label htmlFor="mfa-token" className="block text-sm font-semibold text-foreground">
                  {showBackupCode ? 'Backup Code' : 'Authentication Code'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    {showBackupCode ? (
                      <KeyIcon className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <DevicePhoneMobileIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    id="mfa-token"
                    name="mfa-token"
                    type="text"
                    autoComplete="one-time-code"
                    required={showMfa}
                    className="block w-full border-2 border-border rounded-2xl pl-14 pr-4 py-4 text-foreground placeholder-muted-foreground focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm font-mono text-center tracking-widest text-lg group-hover:border-primary/50"
                    placeholder={showBackupCode ? "XXXXXXXX" : "000000"}
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    maxLength={showBackupCode ? 8 : 6}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-3">
                  <ExclamationCircleIcon className="h-6 w-6 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ShieldCheckIcon className="h-6 w-6" />
                </>
              )}
            </button>

            {/* MFA Toggle */}
            {showMfa && (
              <div className="text-center space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-muted/50 backdrop-blur-sm rounded-2xl p-5 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {showBackupCode 
                      ? 'Enter one of your 8-character backup codes'
                      : 'Enter the 6-digit code from your authenticator app'
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBackupCode(!showBackupCode);
                      setMfaToken('');
                    }}
                    className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl"
                  >
                    {showBackupCode ? (
                      <>
                        <DevicePhoneMobileIcon className="h-4 w-4" />
                        <span>Use authenticator app instead</span>
                      </>
                    ) : (
                      <>
                        <KeyIcon className="h-4 w-4" />
                        <span>Use backup code instead</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors duration-200 hover:underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
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
        
        .slide-in-from-bottom-2 {
          animation: slideInFromBottom 0.3s ease-out;
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
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(8px);
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