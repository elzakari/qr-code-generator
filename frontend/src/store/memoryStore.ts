import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { memoryService } from '../services/memory.service';
import type { QRCode, QRFormData, QRTemplate, QRHistoryItem } from '../types';

interface MemoryState {
  // Cache management
  cacheEnabled: boolean;
  autoCleanup: boolean;
  maxCacheSize: number;
  
  // Actions
  enableCache: () => void;
  disableCache: () => void;
  toggleAutoCleanup: () => void;
  setMaxCacheSize: (size: number) => void;
  
  // QR Code operations
  cacheQRCode: (qr: QRCode) => void;
  getCachedQRCode: (id: string) => QRCode | null;
  cacheQRHistory: (history: QRHistoryItem[], userId?: number) => void;
  getCachedQRHistory: (userId?: number) => QRHistoryItem[] | null;
  
  // Form data operations
  cacheFormData: (formData: Partial<QRFormData>, sessionId?: string) => void;
  getCachedFormData: (sessionId?: string) => Partial<QRFormData> | null;
  
  // Template operations
  cacheTemplates: (templates: QRTemplate[]) => void;
  getCachedTemplates: () => QRTemplate[] | null;
  getCachedTemplate: (id: string) => QRTemplate | null;
  
  // Search operations
  searchCachedQRCodes: (query: string, limit?: number) => QRCode[];
  searchCachedTemplates: (query: string, category?: string, limit?: number) => QRTemplate[];
  
  // Cache management
  clearCache: (pattern?: string) => number;
  clearExpiredEntries: () => number;
  validateCache: () => { isValid: boolean; errors: string[] };
  getCacheStats: () => any;
  getCacheInfo: () => { size: number; keys: string[] };
  
  // Bulk operations
  bulkCacheQRCodes: (qrs: QRCode[]) => void;
  bulkCacheTemplates: (templates: QRTemplate[]) => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      cacheEnabled: true,
      autoCleanup: true,
      maxCacheSize: 1000,
      
      // Cache settings
      enableCache: () => set({ cacheEnabled: true }),
      disableCache: () => set({ cacheEnabled: false }),
      toggleAutoCleanup: () => set(state => ({ autoCleanup: !state.autoCleanup })),
      setMaxCacheSize: (size: number) => set({ maxCacheSize: size }),
      
      // QR Code operations
      cacheQRCode: (qr: QRCode) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          memoryService.storeQRCode(qr);
        }
      },
      
      getCachedQRCode: (id: string) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.getQRCode(id) : null;
      },
      
      cacheQRHistory: (history: QRHistoryItem[], userId?: number) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          memoryService.storeQRHistory(history, userId);
        }
      },
      
      getCachedQRHistory: (userId?: number) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.getQRHistory(userId) : null;
      },
      
      // Form data operations
      cacheFormData: (formData: Partial<QRFormData>, sessionId?: string) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          memoryService.storeFormData(formData, sessionId);
        }
      },
      
      getCachedFormData: (sessionId?: string) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.getFormData(sessionId) : null;
      },
      
      // Template operations
      cacheTemplates: (templates: QRTemplate[]) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          memoryService.storeTemplates(templates);
        }
      },
      
      getCachedTemplates: () => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.getTemplates() : null;
      },
      
      getCachedTemplate: (id: string) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.getTemplate(id) : null;
      },
      
      // Search operations
      searchCachedQRCodes: (query: string, limit = 10) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.searchQRCodes(query, limit) : [];
      },
      
      searchCachedTemplates: (query: string, category?: string, limit = 10) => {
        const { cacheEnabled } = get();
        return cacheEnabled ? memoryService.searchTemplates(query, category, limit) : [];
      },
      
      // Cache management
      clearCache: (pattern?: string) => {
        return memoryService.clearCache(pattern);
      },
      
      clearExpiredEntries: () => {
        return memoryService.clearExpiredEntries();
      },
      
      validateCache: () => {
        return memoryService.validateDataIntegrity();
      },
      
      getCacheStats: () => {
        return memoryService.getStats();
      },
      
      getCacheInfo: () => {
        return memoryService.getCacheInfo();
      },
      
      // Bulk operations
      bulkCacheQRCodes: (qrs: QRCode[]) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          const entries = qrs.map(qr => ({
            key: `qr:${qr.id}`,
            data: qr
          }));
          memoryService.bulkStore(entries);
        }
      },
      
      bulkCacheTemplates: (templates: QRTemplate[]) => {
        const { cacheEnabled } = get();
        if (cacheEnabled) {
          const entries = templates.map(template => ({
            key: `template:${template.id}`,
            data: template
          }));
          memoryService.bulkStore(entries);
        }
      }
    }),
    {
      name: 'memory-storage-settings',
      partialize: (state) => ({
        cacheEnabled: state.cacheEnabled,
        autoCleanup: state.autoCleanup,
        maxCacheSize: state.maxCacheSize
      })
    }
  )
);