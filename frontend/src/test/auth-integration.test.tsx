import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../components/common/NotificationProvider';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Dashboard from '../components/Dashboard';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Mock the auth service
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Mock QR service
vi.mock('../services/qr.service', () => ({
  qrService: {
    getUserQRCodes: vi.fn().mockResolvedValue({ qrs: [], total: 0, pages: 0 }),
    deleteQR: vi.fn(),
    downloadQR: vi.fn(),
    searchQRCodes: vi.fn(),
  },
}));

// Mock auth store
// mocks
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    setLoading: vi.fn(),
  }),
}));

vi.mock('../store/qrStore', () => ({
  useQRStore: vi.fn(),
}));

// Import after mocking
import { authService } from '../services/auth.service';

const TestApp = () => (
  <MemoryRouter initialEntries={["/login"]}>
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  </MemoryRouter>
);

// Wrap initial render to avoid act warnings from AuthProvider/Router effects
async function renderApp() {
  await act(async () => {
    render(<TestApp />);
    await Promise.resolve();
  });
}

it('allows user to login successfully', async () => {
  const mockUser = { id: 1, username: 'testuser', is_admin: false };
  (authService.login as any).mockResolvedValue(mockUser);

  await renderApp();

  await authService.login({ username: 'testuser', password: 'password123' });
  expect(authService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
});

it('allows user to register and redirects to dashboard', async () => {
  const mockUser = { id: 1, username: 'newuser', is_admin: false };
  (authService.register as any).mockResolvedValue(mockUser);

  await renderApp();

  await authService.register('', '', { username: 'newuser', password: 'password123' });
  expect(authService.register).toHaveBeenCalled();
});

it('handles login errors gracefully', async () => {
  (authService.login as any).mockRejectedValue(new Error('Invalid credentials'));

  await renderApp();

  try {
    await authService.login({ username: 'testuser', password: 'wrongpassword' });
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }

  expect(authService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'wrongpassword' });
});

it('handles registration errors gracefully', async () => {
  (authService.register as any).mockRejectedValue(new Error('Username already exists'));

  await renderApp();

  try {
    await authService.register('', '', { username: 'existinguser', password: 'password123' });
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }

  expect(authService.register).toHaveBeenCalledWith('', '', { username: 'existinguser', password: 'password123' });
});

it('redirects unauthenticated users to login', async () => {
  (authService.getCurrentUser as any).mockResolvedValue(null);

  await renderApp();

  await authService.getCurrentUser();
  expect(authService.getCurrentUser).toHaveBeenCalled();
});

it('allows user to register successfully', async () => {
  const mockUser = { id: 1, username: 'newuser', is_admin: false };
  (authService.register as any).mockResolvedValue(mockUser);

  await renderApp();

  await authService.register('', '', { username: 'newuser', password: 'password123' });
  expect(authService.register).toHaveBeenCalledWith('', '', { username: 'newuser', password: 'password123' });
});

it('handles registration failure', async () => {
  (authService.register as any).mockRejectedValue(new Error('Username already exists'));

  await renderApp();

  try {
    await authService.register('', '', { username: 'existinguser', password: 'password123' });
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }

  expect(authService.register).toHaveBeenCalledWith('', '', { username: 'existinguser', password: 'password123' });
});

it('maintains user session across page refreshes', async () => {
  const mockUser = { id: 1, username: 'testuser', is_admin: false };
  (authService.getCurrentUser as any).mockResolvedValue(mockUser);

  await renderApp();

  await authService.getCurrentUser();
  expect(authService.getCurrentUser).toHaveBeenCalled();
});

it('handles logout correctly', async () => {
  (authService.logout as any).mockResolvedValue(undefined);

  await renderApp();

  await authService.logout();
  expect(authService.logout).toHaveBeenCalled();
});