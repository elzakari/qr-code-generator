import { useCallback, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import type { QRCode, QRFormData, QRTemplate, QRHistoryItem } from '../types';

export const useMemoryCache = () => {
  const memoryStore = useMemoryStore();

  // Auto cleanup effect
  useEffect(() => {
    if (memoryStore.autoCleanup) {
      const interval = setInterval(() => {
        memoryStore.clearExpiredEntries();
      }, 5 * 60 * 1000); // Clean every 5 minutes

      return () => clearInterval(interval);
    }
  }, [memoryStore.autoCleanup]);

  // QR Code caching
  const cacheQRCode = useCallback((qr: QRCode) => {
    memoryStore.cacheQRCode(qr);
  }, [memoryStore]);

  const getCachedQRCode = useCallback((id: string) => {
    return memoryStore.getCachedQRCode(id);
  }, [memoryStore]);

  // Form data caching with session support
  const cacheFormData = useCallback((formData: Partial<QRFormData>, sessionId?: string) => {
    memoryStore.cacheFormData(formData, sessionId);
  }, [memoryStore]);

  const getCachedFormData = useCallback((sessionId?: string) => {
    return memoryStore.getCachedFormData(sessionId);
  }, [memoryStore]);

  // Template caching
  const cacheTemplates = useCallback((templates: QRTemplate[]) => {
    memoryStore.cacheTemplates(templates);
  }, [memoryStore]);

  const getCachedTemplates = useCallback(() => {
    return memoryStore.getCachedTemplates();
  }, [memoryStore]);

  // Search functionality
  const searchQRCodes = useCallback((query: string, limit?: number) => {
    return memoryStore.searchCachedQRCodes(query, limit);
  }, [memoryStore]);

  const searchTemplates = useCallback((query: string, category?: string, limit?: number) => {
    return memoryStore.searchCachedTemplates(query, category, limit);
  }, [memoryStore]);

  // Cache management
  const clearCache = useCallback((pattern?: string) => {
    return memoryStore.clearCache(pattern);
  }, [memoryStore]);

  const validateCache = useCallback(() => {
    return memoryStore.validateCache();
  }, [memoryStore]);

  const getCacheStats = useCallback(() => {
    return memoryStore.getCacheStats();
  }, [memoryStore]);

  return {
    // QR Code operations
    cacheQRCode,
    getCachedQRCode,
    
    // Form data operations
    cacheFormData,
    getCachedFormData,
    
    // Template operations
    cacheTemplates,
    getCachedTemplates,
    getCachedTemplate: memoryStore.getCachedTemplate,
    
    // Search operations
    searchQRCodes,
    searchTemplates,
    
    // Cache management
    clearCache,
    validateCache,
    getCacheStats,
    getCacheInfo: memoryStore.getCacheInfo,
    
    // Settings
    cacheEnabled: memoryStore.cacheEnabled,
    autoCleanup: memoryStore.autoCleanup,
    enableCache: memoryStore.enableCache,
    disableCache: memoryStore.disableCache,
    toggleAutoCleanup: memoryStore.toggleAutoCleanup,
    
    // Bulk operations
    bulkCacheQRCodes: memoryStore.bulkCacheQRCodes,
    bulkCacheTemplates: memoryStore.bulkCacheTemplates
  };
};