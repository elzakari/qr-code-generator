import { apiService } from './api.service';
import type { QRFormData, GenerateQRResponse, QRCode, QRHistoryItem } from '../types';

export interface QRSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  content_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'content' | 'downloads';
  sort_order?: 'asc' | 'desc';
}

export interface QRListResponse {
  qrs: QRHistoryItem[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

class QRService {
  async generateQR(
    formData: QRFormData, 
    duplicateCount: number = 1, 
    autoDuplicate: boolean = false,
    signal?: AbortSignal
  ): Promise<GenerateQRResponse> {
    try {
      // Convert form data to API format
      const apiData = {
        content: formData.content,
        error_correction: formData.error_correction,
        size_px: formData.size_px,
        box_size: formData.box_size,
        margin: formData.margin,
        fg_color: formData.fg_color,
        bg_color: formData.bg_color,
        rounded: formData.rounded,
        logo_size: formData.logo_size,
        gradient_enabled: formData.gradient_enabled,
        gradient_start: formData.gradient_start,
        gradient_end: formData.gradient_end,
        gradient_direction: formData.gradient_direction,
        pattern_style: formData.pattern_style,
        eye_style: formData.eye_style,
        data_pattern: formData.data_pattern,
        duplicate_count: duplicateCount,
        auto_duplicate: autoDuplicate
      };

      let response;
      
      // If logo is present, use FormData for file upload
      if (formData.logo) {
        const formDataObj = new FormData();
        Object.entries(apiData).forEach(([key, value]) => {
          formDataObj.append(key, value.toString());
        });
        formDataObj.append('logo', formData.logo);
        
        response = await apiService.post<GenerateQRResponse>('/api/generate', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal
        });
      } else {
        response = await apiService.post<GenerateQRResponse>('/api/generate', apiData, {
          signal
        });
      }
      
      // Return the data property from the Axios response
      return response.data;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }
      throw error;
    }
  }

  async getUserQRCodes(params: QRSearchParams = {}): Promise<QRListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('q', params.search);
      if (params.content_type) queryParams.append('content_type', params.content_type);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const response = await apiService.get<QRListResponse>(`/api/qr/user?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR codes');
    }
  }

  async searchQRCodes(query: string, params: Omit<QRSearchParams, 'search'> = {}): Promise<QRListResponse> {
    return this.getUserQRCodes({ ...params, search: query });
  }

  async downloadQR(id: string, format: 'png' | 'svg' | 'pdf' = 'png'): Promise<Blob> {
    try {
      const response = await apiService.get(`/api/qr/${id}/download?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to download QR code');
    }
  }

  async deleteQR(id: string): Promise<void> {
    try {
      await apiService.delete(`/api/qr/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete QR code');
    }
  }

  async bulkDeleteQR(ids: string[]): Promise<void> {
    try {
      await apiService.post('/api/qr/bulk-delete', { ids });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete QR codes');
    }
  }

  async updateQR(id: string, updates: Partial<QRCode>): Promise<QRCode> {
    try {
      const response = await apiService.put<QRCode>(`/api/qr/${id}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update QR code');
    }
  }

  async getQRAnalytics(id: string): Promise<any> {
    try {
      const response = await apiService.get(`/api/qr/${id}/analytics`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR analytics');
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiService.get('/api/dashboard/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  }

  // Utility methods for content type validation
  validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Content type generators
  generateWiFiContent(ssid: string, password: string, security: string = 'WPA', hidden: boolean = false): string {
    return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
  }

  generateVCardContent(data: {
    firstName: string;
    lastName: string;
    organization?: string;
    phone?: string;
    email?: string;
    url?: string;
    address?: string;
  }): string {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `FN:${data.firstName} ${data.lastName}\n`;
    if (data.organization) vcard += `ORG:${data.organization}\n`;
    if (data.phone) vcard += `TEL:${data.phone}\n`;
    if (data.email) vcard += `EMAIL:${data.email}\n`;
    if (data.url) vcard += `URL:${data.url}\n`;
    if (data.address) vcard += `ADR:${data.address}\n`;
    vcard += 'END:VCARD';
    return vcard;
  }

  generateEmailContent(email: string, subject?: string, body?: string): string {
    let mailto = `mailto:${email}`;
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (params.length > 0) mailto += `?${params.join('&')}`;
    return mailto;
  }

  generateSMSContent(phone: string, message?: string): string {
    let sms = `sms:${phone}`;
    if (message) sms += `?body=${encodeURIComponent(message)}`;
    return sms;
  }
}

export const qrService = new QRService();