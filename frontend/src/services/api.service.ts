import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add any auth tokens or common headers here
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle common errors
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Unauthorized - redirect to login
              window.location.href = '/login';
              break;
            case 403:
              // Forbidden - handled by UI error states
              break;
            case 500:
              // Server error - handled by UI error states
              break;
            default:
              // Other errors - handled by UI error states
              break;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.api;
  }

  // Generic HTTP methods
  public get<T = any>(url: string, config = {}) {
    return this.api.get<T>(url, config);
  }

  public post<T = any>(url: string, data = {}, config = {}) {
    return this.api.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data = {}, config = {}) {
    return this.api.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config = {}) {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;