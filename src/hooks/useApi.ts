import { useState, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiClientError | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiClientError) => void;
  retryOnError?: boolean;
}

/**
 * Custom hook for API calls with loading states and error handling
 * Follows WP-AutoHealer's conservative approach with proper error handling
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : 
        new ApiClientError(500, 'UNKNOWN_ERROR', 'An unexpected error occurred');
      
      setState(prev => ({ ...prev, loading: false, error: apiError }));
      options.onError?.(apiError);
      
      // Auto-retry for retryable errors if enabled
      if (options.retryOnError && apiError.retryable) {
        setTimeout(() => execute(apiCall), 2000);
      }
      
      throw apiError;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isAuthError: state.error?.isAuthenticationError() ?? false,
    isValidationError: state.error?.isValidationError() ?? false,
  };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T = any>(options: UseApiOptions = {}) {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const api = useApi<{ data: T[]; total: number }>(options);

  const loadPage = useCallback(async (
    apiCall: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
    page: number = 1,
    limit: number = 10
  ) => {
    const result = await api.execute(() => apiCall(page, limit));
    
    if (result) {
      setPagination({
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
    }
    
    return result;
  }, [api]);

  return {
    ...api,
    pagination,
    loadPage,
    data: api.data?.data ?? [],
    total: api.data?.total ?? 0,
  };
}