import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for API responses
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
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // Load token from localStorage first (before creating axios instance)
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        this.token = savedToken;
      }
    }

    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[API Client] Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1');
    console.log('[API Client] Full config:', this.client.defaults);

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken(); // Get fresh token
        console.log('[API Interceptor] Request to:', config.url);
        console.log('[API Interceptor] Token from getToken():', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('[API Interceptor] localStorage token:', typeof window !== 'undefined' ? localStorage.getItem('auth_token')?.substring(0, 20) + '...' : 'N/A');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API Interceptor] Authorization header set');
        } else {
          console.warn('[API Interceptor] NO TOKEN - Authorization header NOT set');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    // Always get fresh token from localStorage
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken && savedToken !== this.token) {
        this.token = savedToken;
      }
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('[API] Making login request to:', this.client.defaults.baseURL + '/auth/login');
    console.log('[API] Request payload:', credentials);
    
    try {
      const response = await this.client.post<any>('/auth/login', credentials);
      console.log('[API] Full login response:', response.data);
      
      // Handle wrapped response from backend
      const data = response.data.data || response.data;
      console.log('[API] Extracted data:', data);
      console.log('[API] Token type:', typeof data.token);
      console.log('[API] Token value:', data.token);
      
      if (data.token) {
        this.setToken(data.token);
        const savedToken = localStorage.getItem('auth_token');
        console.log('[API] Token saved to localStorage, verification:', savedToken === data.token);
        console.log('[API] Saved token:', savedToken);
      } else {
        console.warn('[API] No token in login response');
      }
      
      return {
        user: data.user,
        token: data.token,
        requiresMfa: data.requiresMfa,
      };
    } catch (error) {
      console.error('[API] Login request failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('[API] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
          }
        });
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<any>('/auth/me');
    // Handle both wrapped and unwrapped responses
    return response.data.data || response.data;
  }

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

  async enableMfa(token: string): Promise<void> {
    await this.client.post('/auth/mfa/verify', { token });
  }

  async disableMfa(): Promise<void> {
    await this.client.post('/auth/mfa/disable');
  }

  async regenerateBackupCodes(): Promise<string[]> {
    const response = await this.client.post('/auth/mfa/backup-codes/regenerate');
    const data = response.data.data || response.data;
    return data.backupCodes || [];
  }

  // Password reset endpoints
  async requestPasswordReset(email: string): Promise<void> {
    await this.client.post('/auth/password/reset/request', { email });
  }

  async confirmPasswordReset(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.client.post('/auth/password/reset/confirm', {
      token,
      newPassword,
      confirmPassword,
    });
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.client.post('/auth/password/change', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  // Email verification endpoints
  async verifyEmail(token: string): Promise<void> {
    await this.client.post('/auth/verify-email', { token });
  }

  async resendEmailVerification(email: string): Promise<void> {
    await this.client.post('/auth/resend-verification', { email });
  }

  // Session management endpoints
  async getSessions(): Promise<any[]> {
    const response = await this.client.get('/auth/sessions');
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.client.delete(`/auth/sessions/${sessionId}`);
  }

  async logoutAll(): Promise<{ revokedCount: number }> {
    const response = await this.client.post('/auth/logout-all');
    const data = response.data.data || response.data;
    return { revokedCount: data.revokedCount || 0 };
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getDashboardQuickActions(): Promise<any> {
    const response = await this.client.get('/dashboard/quick-actions');
    return response.data;
  }

  // Incidents endpoints
  async getIncidents(params?: { page?: number; limit?: number; status?: string }): Promise<{ incidents: Incident[]; total: number }> {
    const response = await this.client.get('/incidents', { params });
    const data = response.data.data || response.data;
    // Handle both old format {incidents, total} and new format {data: [...], pagination: {total}}
    if (Array.isArray(data)) {
      return {
        incidents: data,
        total: response.data.pagination?.total || data.length,
      };
    }
    return {
      incidents: data.incidents || data.data || [],
      total: data.total || data.pagination?.total || 0,
    };
  }

  async getIncident(id: string): Promise<Incident> {
    const response = await this.client.get<Incident>(`/incidents/${id}`);
    return response.data;
  }

  async getIncidentEvents(incidentId: string): Promise<IncidentEvent[]> {
    const response = await this.client.get<IncidentEvent[]>(`/incidents/${incidentId}/events`);
    return response.data;
  }

  async getIncidentCommands(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/commands`);
    return response.data;
  }

  async getIncidentEvidence(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/evidence`);
    return response.data;
  }

  async getIncidentChanges(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/changes`);
    return response.data;
  }

  async getIncidentBackups(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/backups`);
    return response.data;
  }

  async getIncidentVerifications(incidentId: string): Promise<any[]> {
    const response = await this.client.get(`/incidents/${incidentId}/verifications`);
    return response.data;
  }

  async createIncident(siteId: string, triggerType: string): Promise<Incident> {
    const response = await this.client.post<Incident>('/incidents', { siteId, triggerType });
    return response.data;
  }

  async escalateIncident(id: string, reason: string): Promise<void> {
    await this.client.post(`/incidents/${id}/escalate`, { reason });
  }

  // Sites endpoints
  async getSites(params?: { page?: number; limit?: number }): Promise<{ sites: Site[]; total: number }> {
    const response = await this.client.get('/sites', { params });
    const data = response.data.data || response.data;
    // Handle both old format {sites, total} and new format {data: [...], pagination: {total}}
    if (Array.isArray(data)) {
      return {
        sites: data,
        total: response.data.pagination?.total || data.length,
      };
    }
    return {
      sites: data.sites || data.data || [],
      total: data.total || data.pagination?.total || 0,
    };
  }

  async getSite(id: string): Promise<Site> {
    const response = await this.client.get<Site>(`/sites/${id}`);
    return response.data;
  }

  async createSite(siteData: Partial<Site>): Promise<Site> {
    const response = await this.client.post<Site>('/sites', siteData);
    return response.data;
  }

  async updateSite(id: string, siteData: Partial<Site>): Promise<Site> {
    const response = await this.client.put<Site>(`/sites/${id}`, siteData);
    return response.data;
  }

  async deleteSite(id: string): Promise<void> {
    await this.client.delete(`/sites/${id}`);
  }

  // Servers endpoints
  async getServers(params?: { page?: number; limit?: number }): Promise<{ servers: Server[]; total: number }> {
    const response = await this.client.get('/servers', { params });
    const data = response.data.data || response.data;
    // Handle both old format {servers, total} and new format {data: [...], pagination: {total}}
    if (Array.isArray(data)) {
      return {
        servers: data,
        total: response.data.pagination?.total || data.length,
      };
    }
    return {
      servers: data.servers || data.data || [],
      total: data.total || data.pagination?.total || 0,
    };
  }

  async getServer(id: string): Promise<Server> {
    const response = await this.client.get<Server>(`/servers/${id}`);
    return response.data;
  }

  async createServer(serverData: Partial<Server>): Promise<Server> {
    const response = await this.client.post<Server>('/servers', serverData);
    return response.data;
  }

  async updateServer(id: string, serverData: Partial<Server>): Promise<Server> {
    const response = await this.client.put<Server>(`/servers/${id}`, serverData);
    return response.data;
  }

  async deleteServer(id: string): Promise<void> {
    await this.client.delete(`/servers/${id}`);
  }

  async testServerConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(`/servers/${id}/test-connection`);
    return response.data;
  }

  // Users endpoints
  async getUsers(params?: { page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    const response = await this.client.get('/users', { params });
    const data = response.data.data || response.data;
    // Handle both old format {users, total} and new format {data: [...], pagination: {total}}
    if (Array.isArray(data)) {
      return {
        users: data,
        total: response.data.pagination?.total || data.length,
      };
    }
    return {
      users: data.users || data.data || [],
      total: data.total || data.pagination?.total || 0,
    };
  }

  async createUser(userData: any): Promise<{ user: User; temporaryPassword: string }> {
    const response = await this.client.post('/users', userData);
    const data = response.data.data || response.data;
    return data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.client.put(`/users/${id}`, userData);
    const data = response.data.data || response.data;
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  async updateUserStatus(userId: string, action: 'activate' | 'deactivate'): Promise<void> {
    await this.client.put(`/users/${userId}/${action}`);
  }

  async unlockUser(userId: string): Promise<void> {
    await this.client.put(`/users/${userId}/unlock`);
  }

  // Role management endpoints
  async getRoles(): Promise<any[]> {
    const response = await this.client.get('/roles');
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await this.client.put(`/users/${userId}/role`, { roleId });
  }

  async activateUser(userId: string): Promise<void> {
    await this.client.put(`/users/${userId}/activate`);
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.client.put(`/users/${userId}/deactivate`);
  }

  // Audit endpoints
  async getAuditEvents(params?: { page?: number; limit?: number; userId?: string; action?: string }): Promise<any> {
    const response = await this.client.get('/audit/events', { params });
    return response.data;
  }

  // Generic HTTP methods for direct API calls
  async get(url: string, params?: any): Promise<any> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url: string, data?: any): Promise<any> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url: string, data?: any): Promise<any> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete(url: string): Promise<any> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;