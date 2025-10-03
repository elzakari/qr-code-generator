// Import types from models
import type { QRCode, User } from './models';

export interface GenerateQRResponse {
  id: string;
  download_url: string;
  data_uri: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface DashboardResponse {
  qrs: QRCode[];
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  user?: User;
  error?: string;
  message?: string;
}