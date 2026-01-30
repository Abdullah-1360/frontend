/**
 * Simple in-memory cache for API responses
 * Implements WP-AutoHealer's conservative caching strategy
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }
}

export const apiCache = new ApiCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);
}