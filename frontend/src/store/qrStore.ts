import { create } from 'zustand';
import { memoryService } from '../services/memory.service';
import type { QRCode, GenerateQRResponse, QRFormData } from '../types';

interface QRState {
  recentQRs: QRCode[];
  currentQR: GenerateQRResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Enhanced with memory caching
  addQR: (qr: QRCode) => void;
  setCurrentQR: (qr: GenerateQRResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRecentQRs: () => void;
  
  // New memory-enhanced methods
  getQRFromCache: (id: string) => QRCode | null;
  cacheFormData: (formData: Partial<QRFormData>) => void;
  getCachedFormData: () => Partial<QRFormData> | null;
  searchQRs: (query: string) => QRCode[];
}

export const useQRStore = create<QRState>((set, get) => ({
  recentQRs: [],
  currentQR: null,
  isLoading: false,
  error: null,
  
  addQR: (qr: QRCode) => {
    const current = get().recentQRs;
    // Keep only the last 10 QR codes
    const updated = [qr, ...current].slice(0, 10);
    set({ recentQRs: updated });
    
    // Cache the QR code for quick access
    memoryService.storeQRCode(qr);
  },
  
  setCurrentQR: (qr: GenerateQRResponse | null) => {
    set({ currentQR: qr });
    
    // Cache current QR if available using a custom key approach
    if (qr) {
      // Convert GenerateQRResponse to QRCode format for caching
      const qrCode: QRCode = {
        id: qr.id,
        content: qr.content || '',
        created_at: new Date().toISOString(),
        download_url: qr.download_url,
        content_type: qr.content_type || 'text'
      };
      memoryService.storeQRCode(qrCode, 30 * 60 * 1000); // 30 minutes
    }
  },
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearRecentQRs: () => set({ recentQRs: [] }),
  
  // Memory-enhanced methods
  getQRFromCache: (id: string) => {
    return memoryService.getQRCode(id);
  },
  
  cacheFormData: (formData: Partial<QRFormData>) => {
    memoryService.storeFormData(formData);
  },
  
  getCachedFormData: () => {
    return memoryService.getFormData();
  },
  
  searchQRs: (query: string) => {
    const cachedResults = memoryService.searchQRCodes(query, 10);
    const storeResults = get().recentQRs.filter(qr => 
      qr.content.toLowerCase().includes(query.toLowerCase()) ||
      (qr.content_type && qr.content_type.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Combine and deduplicate results
    const allResults = [...cachedResults, ...storeResults];
    const uniqueResults = allResults.filter((qr, index, self) => 
      index === self.findIndex(q => q.id === qr.id)
    );
    
    return uniqueResults.slice(0, 10);
  }
}));