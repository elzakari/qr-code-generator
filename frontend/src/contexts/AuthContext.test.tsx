import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

// Mock auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Import after mock
import { authService } from '../services/auth.service';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getCurrentUser to return null by default
    (authService.getCurrentUser as any).mockResolvedValue(null);
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for initial auth check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    // The actual error message is "No user found"
    expect(result.current.error).toBe('No user found');
  });

  it('handles successful login', async () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    (authService.login as any).mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as any).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      try {
        await result.current.login('testuser', 'wrongpassword');
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles successful registration', async () => {
    const mockUser = { id: 1, username: 'newuser', is_admin: false };
    (authService.register as any).mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.register('newuser', 'password');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Username already exists';
    (authService.register as any).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      try {
        await result.current.register('existinguser', 'password');
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles logout', async () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    (authService.login as any).mockResolvedValue(mockUser);
    (authService.logout as any).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // First login
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    
    // Then logout
    await act(async () => {
      await result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should have initial error - update to match actual error message
    expect(result.current.error).toBe('No user found');
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('sets loading state during async operations', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    
    (authService.login as any).mockReturnValue(loginPromise);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Start login
    act(() => {
      result.current.login('testuser', 'password');
    });
    
    // Should be loading
    expect(result.current.loading).toBe(true);
    
    // Resolve login
    await act(async () => {
      resolveLogin({ id: 1, username: 'testuser', is_admin: false });
      await loginPromise;
    });
    
    // Should not be loading anymore
    expect(result.current.loading).toBe(false);
  });

  it('restores user session on mount', async () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    (authService.getCurrentUser as any).mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});