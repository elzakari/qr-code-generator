export interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface QRCode {
  content_type: string;
  id: string;
  content: string;
  created_at: string; // ISO date string
  user_id?: number;
  user?: User;
  download_url?: string; // Optional download URL from API responses
}

// Enhanced QR Form Data with advanced customization
export interface QRFormData {
  content: string;
  content_type: 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard';
  error_correction: 'L' | 'M' | 'Q' | 'H';
  size_px: number;
  box_size: number;
  margin: number;
  fg_color: string;
  bg_color: string;
  rounded: number;
  logo?: File;
  logo_size: number; // Logo size as percentage of QR code
  gradient_enabled: boolean;
  gradient_start: string;
  gradient_end: string;
  gradient_direction: 'horizontal' | 'vertical' | 'diagonal';
  pattern_style: 'square' | 'circle' | 'rounded';
  eye_style: 'square' | 'circle' | 'rounded';
  data_pattern: 'square' | 'circle' | 'diamond';
  // Frame and decorative options
  frame_enabled: boolean;
  frame_style: 'none' | 'simple' | 'rounded' | 'shadow' | 'gradient' | 'neon' | 'vintage' | 'modern';
  frame_thickness: number; // 1-20px
  frame_color: string;
  frame_gradient_enabled: boolean;
  frame_gradient_start: string;
  frame_gradient_end: string;
  frame_gradient_direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
  // Advanced styling options
  shadow_enabled: boolean;
  shadow_blur: number;
  shadow_offset_x: number;
  shadow_offset_y: number;
  shadow_color: string;
  // Pattern overlays
  pattern_overlay_enabled: boolean;
  pattern_overlay_type: 'dots' | 'lines' | 'grid' | 'waves' | 'hexagon';
  pattern_overlay_opacity: number;
  pattern_overlay_color: string;
}

// Content type specific data structures
export interface WiFiData {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  phone: string;
  email: string;
  url: string;
  address: string;
}

export interface EmailData {
  email: string;
  subject: string;
  body: string;
}

export interface SMSData {
  phone: string;
  message: string;
}

export interface AuthFormData {
  username: string;
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
}

// Form-specific type that includes confirmPassword for validation
export interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

export interface GenerateQRResponse {
  content: string;
  content_type: string;
  duplicates?: Array<{ id: string; download_url: string; data_uri?: string }>;
  total_generated: number;
  id: string;
  download_url: string;
  data_uri: string;
}

// QR Template for quick generation
export interface QRTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<QRFormData>;
  category: 'business' | 'personal' | 'social' | 'marketing';
}

// QR Generation History with enhanced metadata
export interface QRHistoryItem extends QRCode {
  content_type: string;
  template_used?: string;
  generation_time: number; // milliseconds
  file_size: number; // bytes
  downloads: number;
  last_downloaded?: string;
}