'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate passwords match
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password policy
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors[0]);
      }

      await apiClient.post('/auth/password/reset/confirm', {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);
      setMessage({ 
        type: 'success', 
        text: 'Password reset successfully! You can now login with your new password.' 
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to reset password. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = validatePassword(formData.newPassword);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-md w-full">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 backdrop-blur-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-success to-green-600 rounded-2xl shadow-lg mb-6">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Password Reset Successful
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-lg font-medium transition-colors duration-200 space-x-2"
            >
              <span>Go to Login</span>
              <ArrowLeftIcon className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>

        <style jsx>{`
          .bg-grid-pattern {
            background-image: radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0);
            background-size: 20px 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-md w-full">
        {/* Main Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg mb-6">
              <KeyIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Set new password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  className="block w-full border border-border rounded-lg px-4 py-3 pr-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 bg-background"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  className="block w-full border border-border rounded-lg px-4 py-3 pr-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 bg-background"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-foreground">Password Requirements</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { test: formData.newPassword.length >= 12, text: 'At least 12 characters' },
                    { test: /[a-z]/.test(formData.newPassword), text: 'One lowercase letter' },
                    { test: /[A-Z]/.test(formData.newPassword), text: 'One uppercase letter' },
                    { test: /\d/.test(formData.newPassword), text: 'One number' },
                    { test: /[@$!%*?&]/.test(formData.newPassword), text: 'One special character (@$!%*?&)' },
                  ].map((requirement, index) => (
                    <div key={index} className={`flex items-center space-x-2 text-sm ${
                      requirement.test ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                        requirement.test ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {requirement.test ? '✓' : '○'}
                      </div>
                      <span>{requirement.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className={`text-sm flex items-center space-x-2 ${
                passwordsMatch ? 'text-success' : 'text-destructive'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  passwordsMatch ? 'bg-success text-white' : 'bg-destructive text-white'
                }`}>
                  {passwordsMatch ? '✓' : '✗'}
                </div>
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}

            {/* Error Message */}
            {message && (
              <div className={`rounded-lg p-4 animate-in ${
                message.type === 'success' ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'
              }`}>
                <div className="flex items-center space-x-3">
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                  <p className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-success' : 'text-destructive'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordErrors.length > 0 || !passwordsMatch}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="h-5 w-5" />
                  <span>Reset Password</span>
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Secured by WP-AutoHealer • Enterprise WordPress Management
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}