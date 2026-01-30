import React from 'react';
import { cn } from '@/lib/utils';

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
}

export function Input({ label, error, help, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="form-label">
          {label}
        </label>
      )}
      <input
        className={cn('form-input', error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {help && <p className="form-help">{help}</p>}
    </div>
  );
}

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  help?: string;
  options?: { value: string; label: string }[];
}

export function Select({ label, error, help, options, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="form-label">
          {label}
        </label>
      )}
      <select
        className={cn('form-select', error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && <p className="form-error">{error}</p>}
      {help && <p className="form-help">{help}</p>}
    </div>
  );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClass = variant === 'primary' ? 'btn-primary' : 
                   variant === 'secondary' ? 'btn-secondary' : 
                   'btn-destructive';
  
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={cn(baseClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-header', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-content', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-footer', className)} {...props}>
      {children}
    </div>
  );
}

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantClass = variant === 'success' ? 'badge-success' :
                      variant === 'warning' ? 'badge-warning' :
                      variant === 'error' ? 'badge-error' :
                      variant === 'info' ? 'badge-info' :
                      'badge-neutral';

  return (
    <span className={cn('badge', variantClass, className)} {...props}>
      {children}
    </span>
  );
}