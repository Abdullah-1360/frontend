import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for API responses
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  roleId: string;
  role: {
    id: string;
    name: 'SUPER_ADMIN' | 'ADMIN' | 'ENGINEER' | 'VIEWER';
    displayName: string;
    description: string;
    isSystem: boolean;
    permissions: Array<{
      id: string;
      roleId: string;
      resource: string;
      action: string;
    }>;
  };
  mfaEnabled: boolean;
  isActive: boolean;
  isLocked: boolean;
  lockoutUntil?: string;
  failedLoginAttempts: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  passwordChangedAt: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  fullName: string;
  isAccountLocked: boolean;
  needsPasswordChange: boolean;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: 'key' | 'password';
  controlPanel?: string;
  osInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  serverId: string;
  domain: string;
  documentRoot: string;
  wordpressPath: string;
  isMultisite: boolean;
  siteUrl: string;
  adminUrl: string;
  isActive: boolean;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  siteId: string;
  state: 'NEW' | 'DISCOVERY' | 'BASELINE' | 'BACKUP' | 'OBSERVABILITY' | 'FIX_ATTEMPT' | 'VERIFY' | 'FIXED' | 'ROLLBACK' | 'ESCALATED';
  triggerType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fixAttempts: number;
  maxFixAttempts: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  escalatedAt?: string;
  escalationReason?: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  eventType: string;
  phase: string;
  step: string;
  data: any;
  timestamp: string;
  duration?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  requiresMfa?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  timestamp: string;
  path: string;
  details?: any;
  retryable?: boolean;
}

export class ApiClientError extends Error {
  public readonly retryable: boolean;

  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.retryable = retryable;
  }

  /**
   * Create ApiClientError from Axios error object
   * @param error - Axios error object
   * @returns ApiClientError instance with appropriate error details and retry flag
   */
  static fromAxiosError(error: any): ApiClientError {
    const isRetryable = !error.response || 
                       error.response.status === 429 || 
                       (error.response.status >= 500 && error.response.status < 600);

    if (error.response?.data) {
      const apiError = error.response.data;
      return new ApiClientError(
        apiError.statusCode || error.response.status,
        apiError.code || 'UNKNOWN_ERROR',
        apiError.message || error.message,
        apiError.details,
        isRetryable
      );
    }
    
    return new ApiClientError(
      error.response?.status || 500,
      'NETWORK_ERROR',
      error.message || 'Network error occurred',
      undefined,
      isRetryable
    );
  }

  /**
   * Check if this error indicates the user should re-authenticate
   */
  isAuthenticationError(): boolean {
    return this.statusCode === 401 || this.code === 'TOKEN_EXPIRED';
  }

  /**
   * Check if this error indicates a permission issue
   */
  isAuthorizationError(): boolean {
    return this.statusCode === 403;
  }

  /**
   * Check if this error indicates a validation issue
   */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.code === 'VALIDATION_ERROR';
  }
}

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  enableLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  enableLogging: process.env.NODE_ENV === 'development',
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * API client for WP-AutoHealer backend services
 * Handles authentication, request/response interceptors, and all API endpoints
 */
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private readonly config: Required<ApiClientConfig>;
  private readonly abortControllers = new Map<string, AbortController>();

  /**
   * Initialize the API client with base configuration and interceptors
   */
  constructor(config: ApiClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeToken();
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Initialize token from multiple storage sources for better persistence
   */
  private initializeToken(): void {
    if (typeof window !== 'undefined') {
      // Try localStorage first (primary storage)
      let savedToken = localStorage.getItem('auth_token');
      
      // Fallback to sessionStorage if localStorage is empty
      if (!savedToken) {
        savedToken = sessionStorage.getItem('auth_token');
        if (savedToken) {
          console.log('[API Client] Token recovered from sessionStorage');
          // Restore to localStorage for consistency
          localStorage.setItem('auth_token', savedToken);
        }
      }
      
      // Fallback to cookie if both storage methods are empty
      if (!savedToken) {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        if (tokenCookie) {
          savedToken = tokenCookie.split('=')[1];
          console.log('[API Client] Token recovered from cookie');
          // Restore to localStorage for consistency
          localStorage.setItem('auth_token', savedToken);
        }
      }
      
      if (savedToken) {
        this.token = savedToken;
        console.log('[API Client] Token initialized successfully');
      } else {
        console.log('[API Client] No token found in any storage location');
      }
    }
  }

  /**
   * Create and configure Axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    if (this.config.enableLogging) {
      console.log('[API Client] Base URL:', this.config.baseURL);
    }

    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor for authentication and token refresh
   */
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      async (config) => {
        // Attempt token refresh if needed
        await this.refreshTokenIfNeeded();
        
        const token = this.getToken();
        
        if (this.config.enableLogging) {
          console.log('[API Interceptor] Request to:', config.url);
          console.log('[API Interceptor] Token available:', !!token);
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Extract token expiry timestamp from JWT token
   * @private
   */
  private extractTokenExpiry(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp || null;
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('[API Client] Failed to extract token expiry:', error);
      }
      return null;
    }
  }

  /**
   * Check if token needs refresh and attempt to refresh it if necessary
   * This method checks token expiry and refreshes it proactively to avoid 401 errors
   * @private
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const token = this.getToken();
    if (!token) return;
    
    try {
      const tokenExpiry = this.extractTokenExpiry(token);
      if (!tokenExpiry) return;
      
      // Refresh token if it expires within the next 5 minutes
      const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + (5 * 60);
      
      if (tokenExpiry <= fiveMinutesFromNow) {
        if (this.config.enableLogging) {
          console.log('[API Client] Token expires soon, attempting refresh');
        }
        
        // Attempt to refresh token via refresh endpoint
        try {
          const response = await this.client.post('/auth/refresh');
          const data = this.extractResponseData<{ token?: string }>(response);
          
          if (data && typeof data === 'object' && 'token' in data && data.token) {
            this.setToken(data.token);
            if (this.config.enableLogging) {
              console.log('[API Client] Token refreshed successfully');
            }
          }
        } catch (refreshError) {
          if (this.config.enableLogging) {
            console.warn('[API Client] Token refresh failed, will attempt login redirect on 401');
          }
          // Don't throw here - let the original request proceed and handle 401 in response interceptor
        }
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('[API Client] Error checking token expiry:', error);
      }
      // Don't throw - let the request proceed
    }
  }

  /**
   * Setup response interceptor for error handling and retry logic
   */
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Ensure originalRequest exists and has the necessary properties
        if (!originalRequest) {
          return Promise.reject(ApiClientError.fromAxiosError(error));
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          this.handleUnauthorized();
          return Promise.reject(ApiClientError.fromAxiosError(error));
        }
        
        // Handle rate limiting (429) and server errors (5xx) with retry
        if (this.shouldRetryRequest(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount <= this.config.maxRetries) {
            const delay = this.calculateRetryDelay(originalRequest._retryCount, error.response?.status);
            
            if (this.config.enableLogging) {
              console.log(`[API Client] Retrying request (${originalRequest._retryCount}/${this.config.maxRetries}) after ${delay}ms`);
            }
            
            await this.delay(delay);
            return this.client(originalRequest);
          }
        }
        
        // Transform axios errors to our custom error format
        const apiError = ApiClientError.fromAxiosError(error);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Determine if a request should be retried based on error type
   */
  private shouldRetryRequest(error: any): boolean {
    if (!error.response) return true; // Network errors
    
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600); // Rate limit or server errors
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number, statusCode?: number): number {
    // Use longer delay for rate limiting
    const baseDelay = statusCode === 429 ? 2000 : this.config.retryDelay;
    return baseDelay * Math.pow(2, retryCount - 1);
  }

  /**
   * Utility function to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle unauthorized responses
   */
  private handleUnauthorized(): void {
    this.clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  /**
   * Extract data from API response, handling wrapped responses
   */
  private extractResponseData<T>(response: AxiosResponse): T {
    const data = response.data;
    
    if (data && typeof data === 'object') {
      // Handle double-wrapped responses (data.data.data)
      if (data.data && data.data.data && typeof data.data.data === 'object') {
        return data.data.data;
      }
      // Handle single-wrapped responses (data.data)
      if (data.data !== undefined) {
        return data.data;
      }
      // If no wrapper, return the data directly
      return data;
    }
    
    return data;
  }

  /**
   * Extract paginated data from API response
   */
  private extractPaginatedData<T>(response: AxiosResponse, dataKey: string): { data: T[]; total: number } {
    const responseData = response.data.data || response.data;
    
    // Handle array response format
    if (Array.isArray(responseData)) {
      return {
        data: responseData,
        total: response.data.pagination?.total || responseData.length,
      };
    }
    
    // Handle object response format
    return {
      data: responseData[dataKey] || responseData.data || [],
      total: responseData.total || responseData.pagination?.total || 0,
    };
  }

  /**
   * Set authentication token and store in multiple locations for persistence
   * @param token - JWT token to set
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Store in localStorage (primary)
      localStorage.setItem('auth_token', token);
      
      // Store in sessionStorage (backup)
      sessionStorage.setItem('auth_token', token);
      
      // Store in secure cookie (for SSR/middleware) - simplified
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
      
      console.log('[API Client] Token stored in all locations');
    }
  }

  /**
   * Get current authentication token with enhanced persistence checking
   * @returns Current JWT token or null if not authenticated
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      // Always get fresh token from localStorage first
      let savedToken = localStorage.getItem('auth_token');
      
      // If localStorage is empty, try sessionStorage
      if (!savedToken) {
        savedToken = sessionStorage.getItem('auth_token');
        if (savedToken) {
          console.log('[API Client] Token recovered from sessionStorage, restoring to localStorage');
          localStorage.setItem('auth_token', savedToken);
        }
      }
      
      // If both are empty, try cookie as last resort
      if (!savedToken) {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        if (tokenCookie) {
          savedToken = tokenCookie.split('=')[1];
          console.log('[API Client] Token recovered from cookie, restoring to localStorage');
          localStorage.setItem('auth_token', savedToken);
          sessionStorage.setItem('auth_token', savedToken);
        }
      }
      
      // Update in-memory token if we found a different one
      if (savedToken && savedToken !== this.token) {
        this.token = savedToken;
        console.log('[API Client] Token updated from storage');
      }
    }
    
    return this.token;
  }

  /**
   * Clear authentication token from all storage locations
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      // Clear from all storage locations
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // Clear the cookie by setting it to expire in the past
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
      
      console.log('[API Client] Token cleared from all storage locations');
    }
  }

  // Auth endpoints
  /**
   * Authenticate user with email/password and optional MFA token
   * @param credentials - Login credentials including email, password, and optional MFA token
   * @returns Authentication response with user data and JWT token
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.client.post<any>('/auth/login', credentials);
      // Login endpoint returns data directly, not wrapped
      const data = response.data;
      
      if (this.config.enableLogging) {
        console.log('[API] Login successful, token available:', !!data.token);
        console.log('[API] Login user data:', data.user);
      }
      
      if (data.token) {
        this.setToken(data.token);
      }
      
      return {
        user: data.user,
        token: data.token,
        requiresMfa: data.requiresMfa,
      };
    } catch (error) {
      if (this.config.enableLogging && axios.isAxiosError(error)) {
        console.error('[API] Login failed:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Log out current user and clear authentication token
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  /**
   * Get current authenticated user information
   * @returns Current user data
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<any>('/auth/me');
    const userData = this.extractResponseData<User>(response);
    
    if (this.config.enableLogging) {
      console.log('[API] Current user data:', userData);
    }
    
    return userData as User;
  }

  /**
   * Setup multi-factor authentication for current user
   * @returns MFA setup data including secret, QR code, and backup codes
   */
  async setupMfa(): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const response = await this.client.post('/auth/mfa/setup');
    console.log('[API] MFA Setup Response:', JSON.stringify(response.data, null, 2));
    
    // Handle triple-wrapped response from backend
    // Structure: response.data.data.data (because of apiResponseService wrapper)
    let data = response.data;
    console.log('[API] Initial data:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.data && data.data.data.data) {
      console.log('[API] Using triple-wrapped data');
      data = data.data.data.data; // Triple wrapped
    } else if (data.data && data.data.data) {
      console.log('[API] Using double-wrapped data');
      data = data.data.data; // Double wrapped
    } else if (data.data) {
      console.log('[API] Using single-wrapped data');
      data = data.data; // Single wrapped
    } else {
      console.log('[API] Using unwrapped data');
    }
    
    console.log('[API] MFA Setup Final Data:', JSON.stringify(data, null, 2));
    console.log('[API] Secret exists:', !!data.secret);
    console.log('[API] QR Code exists:', !!data.qrCode);
    console.log('[API] Secret length:', data.secret ? data.secret.length : 0);
    console.log('[API] QR Code length:', data.qrCode ? data.qrCode.length : 0);
    console.log('[API] QR Code starts with:', data.qrCode ? data.qrCode.substring(0, 30) : 'N/A');
    
    return {
      secret: data.secret || '',
      qrCode: data.qrCode || '',
      backupCodes: data.backupCodes || []
    };
  }

  /**
   * Enable multi-factor authentication with verification token
   * @param token - TOTP token from authenticator app
   */
  async enableMfa(token: string): Promise<void> {
    await this.client.post('/auth/mfa/verify', { token });
  }

  /**
   * Disable multi-factor authentication for current user
   */
  async disableMfa(): Promise<void> {
    await this.client.post('/auth/mfa/disable');
  }

  /**
   * Regenerate MFA backup codes
   * @returns Array of new backup codes
   */
  async regenerateBackupCodes(): Promise<string[]> {
    const response = await this.client.post('/auth/mfa/backup-codes/regenerate');
    const data = response.data.data || response.data;
    return data.backupCodes || [];
  }

  // Password reset endpoints
  /**
   * Request password reset email for user
   * @param email - Email address to send reset link to
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.client.post('/auth/password/reset/request', { email });
  }

  /**
   * Confirm password reset with token and new password
   * @param token - Password reset token from email
   * @param newPassword - New password to set
   * @param confirmPassword - Password confirmation
   */
  async confirmPasswordReset(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.client.post('/auth/password/reset/confirm', {
      token,
      newPassword,
      confirmPassword,
    });
  }

  /**
   * Change password for authenticated user
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @param confirmPassword - Password confirmation
   */
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.client.post('/auth/password/change', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  // Email verification endpoints
  /**
   * Verify email address with token
   * @param token - Email verification token
   */
  async verifyEmail(token: string): Promise<void> {
    await this.client.post('/auth/verify-email', { token });
  }

  /**
   * Resend email verification for user
   * @param email - Email address to resend verification to
   */
  async resendEmailVerification(email: string): Promise<void> {
    await this.client.post('/auth/resend-verification', { email });
  }

  // Session management endpoints
  /**
   * Get all active sessions for current user
   * @returns Array of active sessions
   */
  async getSessions(): Promise<any[]> {
    const response = await this.client.get('/auth/sessions');
    const data = this.extractResponseData(response);
    
    if (this.config.enableLogging) {
      console.log('[API] Sessions response:', data);
    }
    
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  }

  /**
   * Revoke a specific session
   * @param sessionId - ID of session to revoke
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.client.delete(`/auth/sessions/${sessionId}`);
  }

  /**
   * Log out from all sessions
   * @returns Number of sessions that were revoked
   */
  async logoutAll(): Promise<{ revokedCount: number }> {
    const response = await this.client.post('/auth/logout-all');
    const data = response.data.data || response.data;
    return { revokedCount: data.revokedCount || 0 };
  }

  // Dashboard endpoints
  /**
   * Get dashboard statistics and metrics
   * @returns Dashboard statistics data
   */
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  /**
   * Get dashboard quick actions
   * @returns Available quick actions for dashboard
   */
  async getDashboardQuickActions(): Promise<any> {
    const response = await this.client.get('/dashboard/quick-actions');
    return response.data;
  }

  // Incidents endpoints
  /**
   * Get paginated list of incidents with optional filtering
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated incidents data with total count
   */
  async getIncidents(params?: { page?: number; limit?: number; status?: string }): Promise<{ incidents: Incident[]; total: number }> {
    const response = await this.client.get('/incidents', { params });
    const { data, total } = this.extractPaginatedData<Incident>(response, 'incidents');
    return { incidents: data, total };
  }

  /**
   * Get specific incident by ID
   * @param id - Incident ID
   * @returns Incident data
   */
  async getIncident(id: string): Promise<Incident> {
    const response = await this.client.get<Incident>(`/incidents/${id}`);
    return response.data;
  }

  /**
   * Get timeline events for specific incident
   * @param incidentId - Incident ID
   * @returns Array of incident events
   */
  async getIncidentEvents(incidentId: string): Promise<IncidentEvent[]> {
    const response = await this.client.get<IncidentEvent[]>(`/incidents/${incidentId}/events`);
    return response.data;
  }

  /**
   * Get command executions for specific incident
   * @param incidentId - Incident ID
   * @returns Array of command execution records
   */
  async getIncidentCommands(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/commands`);
    return response.data;
  }

  /**
   * Get evidence collected for specific incident
   * @param incidentId - Incident ID
   * @returns Array of evidence records
   */
  async getIncidentEvidence(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/evidence`);
    return response.data;
  }

  /**
   * Get changes made during specific incident
   * @param incidentId - Incident ID
   * @returns Array of change records
   */
  async getIncidentChanges(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/changes`);
    return response.data;
  }

  /**
   * Get backup artifacts for specific incident
   * @param incidentId - Incident ID
   * @returns Array of backup artifact records
   */
  async getIncidentBackups(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/backups`);
    return response.data;
  }

  /**
   * Get verification results for specific incident
   * @param incidentId - Incident ID
   * @returns Array of verification records
   */
  async getIncidentVerifications(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/verifications`);
    return response.data;
  }

  /**
   * Create new incident for a site
   * @param siteId - Site ID to create incident for
   * @param triggerType - Type of trigger that initiated the incident
   * @returns Created incident data
   */
  async createIncident(siteId: string, triggerType: string): Promise<Incident> {
    const response = await this.client.post<Incident>('/incidents', { siteId, triggerType });
    return response.data;
  }

  /**
   * Escalate incident to external support
   * @param id - Incident ID to escalate
   * @param reason - Reason for escalation
   */
  async escalateIncident(id: string, reason: string): Promise<void> {
    await this.client.post(`/incidents/${id}/escalate`, { reason });
  }

  // Sites endpoints
  /**
   * Get paginated list of sites
   * @param params - Query parameters for pagination
   * @returns Paginated sites data with total count
   */
  async getSites(params?: { page?: number; limit?: number }): Promise<{ sites: Site[]; total: number }> {
    const response = await this.client.get('/sites', { params });
    const { data, total } = this.extractPaginatedData<Site>(response, 'sites');
    return { sites: data, total };
  }

  /**
   * Get specific site by ID
   * @param id - Site ID
   * @returns Site data
   */
  async getSite(id: string): Promise<Site> {
    const response = await this.client.get<Site>(`/sites/${id}`);
    return response.data;
  }

  /**
   * Create new site
   * @param siteData - Site data to create
   * @returns Created site data
   */
  async createSite(siteData: Partial<Site>): Promise<Site> {
    const response = await this.client.post<Site>('/sites', siteData);
    return response.data;
  }

  /**
   * Update existing site
   * @param id - Site ID to update
   * @param siteData - Partial site data to update
   * @returns Updated site data
   */
  async updateSite(id: string, siteData: Partial<Site>): Promise<Site> {
    const response = await this.client.put<Site>(`/sites/${id}`, siteData);
    return response.data;
  }

  /**
   * Delete site by ID
   * @param id - Site ID to delete
   */
  async deleteSite(id: string): Promise<void> {
    await this.client.delete(`/sites/${id}`);
  }

  // Servers endpoints
  /**
   * Get paginated list of servers
   * @param params - Query parameters for pagination
   * @returns Paginated servers data with total count
   */
  async getServers(params?: { page?: number; limit?: number }): Promise<{ servers: Server[]; total: number }> {
    const response = await this.client.get('/servers', { params });
    const { data, total } = this.extractPaginatedData<Server>(response, 'servers');
    return { servers: data, total };
  }

  /**
   * Get specific server by ID
   * @param id - Server ID
   * @returns Server data
   */
  async getServer(id: string): Promise<Server> {
    const response = await this.client.get<Server>(`/servers/${id}`);
    return response.data;
  }

  /**
   * Create new server
   * @param serverData - Server data to create
   * @returns Created server data
   */
  async createServer(serverData: Partial<Server>): Promise<Server> {
    const response = await this.client.post<Server>('/servers', serverData);
    return response.data;
  }

  /**
   * Update existing server
   * @param id - Server ID to update
   * @param serverData - Partial server data to update
   * @returns Updated server data
   */
  async updateServer(id: string, serverData: Partial<Server>): Promise<Server> {
    const response = await this.client.put<Server>(`/servers/${id}`, serverData);
    return response.data;
  }

  /**
   * Delete server by ID
   * @param id - Server ID to delete
   */
  async deleteServer(id: string): Promise<void> {
    await this.client.delete(`/servers/${id}`);
  }

  /**
   * Test SSH connection to server
   * @param id - Server ID to test connection for
   * @returns Connection test result with success status and message
   */
  async testServerConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(`/servers/${id}/test-connection`);
    return response.data;
  }

  // Users endpoints
  /**
   * Get paginated list of users
   * @param params - Query parameters for pagination
   * @returns Paginated users data with total count
   */
  async getUsers(params?: { page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    const response = await this.client.get('/users', { params });
    const { data, total } = this.extractPaginatedData<User>(response, 'users');
    return { users: data, total };
  }

  /**
   * Create new user
   * @param userData - User data to create
   * @returns Created user data with temporary password
   */
  async createUser(userData: any): Promise<{ user: User; temporaryPassword: string }> {
    const response = await this.client.post('/users', userData);
    return this.extractResponseData(response);
  }

  /**
   * Update existing user (partial update)
   * @param id - User ID to update
   * @param userData - Partial user data to update
   * @returns Updated user data
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.client.patch(`/users/${id}`, userData);
    return this.extractResponseData(response);
  }

  /**
   * Delete user by ID
   * @param id - User ID to delete
   */
  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  /**
   * Update user status (activate or deactivate)
   * @param userId - User ID to update status for
   * @param action - Action to perform ('activate' or 'deactivate')
   */
  async updateUserStatus(userId: string, action: 'activate' | 'deactivate'): Promise<void> {
    await this.client.patch(`/users/${userId}/${action}`);
  }

  /**
   * Unlock user account
   * @param userId - User ID to unlock
   */
  async unlockUser(userId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/unlock`);
  }

  // Role management endpoints
  /**
   * Get all available roles
   * @returns Array of role data
   */
  async getRoles(): Promise<any[]> {
    const response = await this.client.get('/roles');
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Assign role to user
   * @param userId - User ID to assign role to
   * @param roleId - Role ID to assign
   */
  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/role`, { roleId });
  }

  /**
   * Activate user account
   * @param userId - User ID to activate
   */
  async activateUser(userId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/activate`);
  }

  /**
   * Deactivate user account
   * @param userId - User ID to deactivate
   */
  async deactivateUser(userId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/deactivate`);
  }

  // Audit endpoints
  /**
   * Get audit events with optional filtering
   * @param params - Query parameters for pagination and filtering
   * @returns Audit events data
   */
  async getAuditEvents(params?: { page?: number; limit?: number; userId?: string; action?: string }): Promise<any> {
    const response = await this.client.get('/audit/events', { params });
    return response.data;
  }

  // Generic HTTP methods for direct API calls
  /**
   * Generic GET request
   * @param url - API endpoint URL
   * @param params - Query parameters
   * @returns Response data
   */
  async get(url: string, params?: any): Promise<any> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  /**
   * Generic POST request
   * @param url - API endpoint URL
   * @param data - Request body data
   * @returns Response data
   */
  async post(url: string, data?: any): Promise<any> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   * @param url - API endpoint URL
   * @param data - Request body data
   * @returns Response data
   */
  async put(url: string, data?: any): Promise<any> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   * @param url - API endpoint URL
   * @returns Response data
   */
  async delete(url: string): Promise<any> {
    const response = await this.client.delete(url);
    return response.data;
  }

  // Account lockout management endpoints
  /**
   * Unlock a user account (admin only)
   * @param userId - ID of user to unlock
   * @returns Success response
   */
  async unlockUserAccount(userId: string): Promise<void> {
    await this.client.put(`/users/${userId}/unlock`);
  }

  /**
   * Lock a user account (admin only)
   * @param userId - ID of user to lock
   * @param reason - Reason for locking the account
   * @returns Success response
   */
  async lockUserAccount(userId: string, reason?: string): Promise<void> {
    await this.client.patch(`/users/${userId}/lock`, { reason });
  }

  /**
   * Get account lockout statistics (admin only)
   * @returns Lockout statistics
   */
  async getLockoutStats(): Promise<{
    totalLockedAccounts: number;
    accountsLockedToday: number;
    topFailedAttemptUsers: Array<{ email: string; username: string; failedAttempts: number }>;
  }> {
    const response = await this.client.get('/users/lockout-stats');
    return this.extractResponseData(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;