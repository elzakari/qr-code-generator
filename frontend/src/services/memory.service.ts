import type { QRCode, QRFormData, GenerateQRResponse, User, QRTemplate, QRHistoryItem } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  memoryUsage: number;
}

interface SearchIndex {
  [key: string]: Set<string>;
}

class MemoryStorageService {
  private cache = new Map<string, CacheEntry<any>>();
  private searchIndex: SearchIndex = {};
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalEntries: 0,
    memoryUsage: 0
  };
  
  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = {
    QR_CODES: 30 * 60 * 1000, // 30 minutes
    USER_DATA: 60 * 60 * 1000, // 1 hour
    TEMPLATES: 24 * 60 * 60 * 1000, // 24 hours
    FORM_DATA: 10 * 60 * 1000, // 10 minutes
    SEARCH_RESULTS: 5 * 60 * 1000 // 5 minutes
  };

  // QR Code Management
  public storeQRCode(qr: QRCode, ttl?: number): void {
    const key = `qr:${qr.id}`;
    this.setCache(key, qr, ttl || this.DEFAULT_TTL.QR_CODES);
    this.updateSearchIndex('qr', qr.id, [qr.content, qr.content_type || 'text']);
  }

  public getQRCode(id: string): QRCode | null {
    return this.getCache(`qr:${id}`);
  }

  public storeQRHistory(history: QRHistoryItem[], userId?: number): void {
    const key = userId ? `history:user:${userId}` : 'history:global';
    this.setCache(key, history, this.DEFAULT_TTL.QR_CODES);
    
    // Index each QR code for search
    history.forEach(qr => {
      this.updateSearchIndex('history', qr.id, [qr.content, qr.content_type || 'text']);
    });
  }

  public getQRHistory(userId?: number): QRHistoryItem[] | null {
    const key = userId ? `history:user:${userId}` : 'history:global';
    return this.getCache(key);
  }

  // Form Data Management
  public storeFormData(formData: Partial<QRFormData>, sessionId?: string): void {
    const key = sessionId ? `form:${sessionId}` : 'form:current';
    this.setCache(key, formData, this.DEFAULT_TTL.FORM_DATA);
  }

  public getFormData(sessionId?: string): Partial<QRFormData> | null {
    const key = sessionId ? `form:${sessionId}` : 'form:current';
    return this.getCache(key);
  }

  // Template Management
  public storeTemplates(templates: QRTemplate[]): void {
    this.setCache('templates:all', templates, this.DEFAULT_TTL.TEMPLATES);
    
    // Store individual templates for quick access
    templates.forEach(template => {
      this.setCache(`template:${template.id}`, template, this.DEFAULT_TTL.TEMPLATES);
      this.updateSearchIndex('template', template.id, [
        template.name, 
        template.description, 
        template.category
      ]);
    });
  }

  public getTemplates(): QRTemplate[] | null {
    return this.getCache('templates:all');
  }

  public getTemplate(id: string): QRTemplate | null {
    return this.getCache(`template:${id}`);
  }

  // User Data Management
  public storeUserData(user: User): void {
    this.setCache(`user:${user.id}`, user, this.DEFAULT_TTL.USER_DATA);
    this.setCache('user:current', user, this.DEFAULT_TTL.USER_DATA);
  }

  public getUserData(id?: number): User | null {
    if (id) {
      return this.getCache(`user:${id}`);
    }
    return this.getCache('user:current');
  }

  // Search Functionality
  public searchQRCodes(query: string, limit: number = 10): QRCode[] {
    const results = this.performSearch('qr', query, limit);
    return results.map(id => this.getQRCode(id)).filter(Boolean) as QRCode[];
  }

  public searchTemplates(query: string, category?: string, limit: number = 10): QRTemplate[] {
    let results = this.performSearch('template', query, limit);
    
    if (category) {
      results = results.filter(id => {
        const template = this.getTemplate(id);
        return template?.category === category;
      });
    }
    
    return results.map(id => this.getTemplate(id)).filter(Boolean) as QRTemplate[];
  }

  // Cache Management
  private setCache<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
    this.updateStats();
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data as T;
  }

  // Search Index Management
  private updateSearchIndex(type: string, id: string, searchTerms: string[]): void {
    searchTerms.forEach(term => {
      const normalizedTerm = term.toLowerCase();
      const indexKey = `${type}:${normalizedTerm}`;
      
      if (!this.searchIndex[indexKey]) {
        this.searchIndex[indexKey] = new Set();
      }
      
      this.searchIndex[indexKey].add(id);
    });
  }

  private performSearch(type: string, query: string, limit: number): string[] {
    const normalizedQuery = query.toLowerCase();
    const results = new Set<string>();
    
    // Search for exact matches and partial matches
    Object.keys(this.searchIndex).forEach(indexKey => {
      if (indexKey.startsWith(`${type}:`) && indexKey.includes(normalizedQuery)) {
        this.searchIndex[indexKey].forEach(id => results.add(id));
      }
    });
    
    return Array.from(results).slice(0, limit);
  }

  // Data Integrity and Validation
  public validateDataIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    // Check for expired entries
    const expiredKeys: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    if (expiredKeys.length > 0) {
      errors.push(`Found ${expiredKeys.length} expired cache entries`);
      // Clean up expired entries
      expiredKeys.forEach(key => this.cache.delete(key));
    }

    // Validate data consistency
    try {
      this.cache.forEach((entry, key) => {
        if (!entry.data || typeof entry.timestamp !== 'number') {
          errors.push(`Invalid cache entry structure for key: ${key}`);
          isValid = false;
        }
      });
    } catch (error) {
      errors.push(`Cache validation error: ${error}`);
      isValid = false;
    }

    this.updateStats();
    return { isValid, errors };
  }

  // Performance and Statistics
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Memory Management
  public clearExpiredEntries(): number {
    let clearedCount = 0;
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        clearedCount++;
      }
    });
    
    this.updateStats();
    return clearedCount;
  }

  public clearCache(pattern?: string): number {
    let clearedCount = 0;
    
    if (pattern) {
      const regex = new RegExp(pattern);
      this.cache.forEach((_, key) => {
        if (regex.test(key)) {
          this.cache.delete(key);
          clearedCount++;
        }
      });
    } else {
      clearedCount = this.cache.size;
      this.cache.clear();
      this.searchIndex = {};
    }
    
    this.updateStats();
    return clearedCount;
  }

  // Efficient bulk operations
  public bulkStore<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.setCache(key, data, ttl);
    });
  }

  public bulkGet<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: this.getCache<T>(key)
    }));
  }

  // Export/Import for persistence
  public exportCache(): string {
    const exportData = {
      cache: Array.from(this.cache.entries()),
      searchIndex: this.searchIndex,
      stats: this.stats,
      timestamp: Date.now()
    };
    
    return JSON.stringify(exportData);
  }

  public importCache(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      if (importData.cache && Array.isArray(importData.cache)) {
        this.cache = new Map(importData.cache);
        this.searchIndex = importData.searchIndex || {};
        this.updateStats();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import cache data:', error);
      return false;
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0;
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry).length * 2;
    });
    return size;
  }
}

// Singleton instance
export const memoryService = new MemoryStorageService();
export default memoryService;