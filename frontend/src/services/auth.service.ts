import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, RegisterData, User, ApiResponse } from '../types';

class AuthService {
  private baseURL = '/auth/api';

  async login(credentials: LoginCredentials): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await axios.post(
      `${this.baseURL}/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.data.user) {
      return response.data.user;
    }

    throw new Error(response.data.message || 'Login failed');
  }

  async register(userData: RegisterData): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await axios.post(
      `${this.baseURL}/register`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.data.user) {
      return response.data.user;
    }

    throw new Error(response.data.message || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/logout`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
    } catch (error) {
      // Even if logout fails on server, we should clear client state
      // Error is handled by UI components
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await axios.get(
        `${this.baseURL}/user`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success && response.data.user) {
        return response.data.user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;