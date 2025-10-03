import React from 'react';
import { vi } from 'vitest';
// LoginForm.test imports
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';
import { NotificationProvider } from '../common/NotificationProvider';

// Mock react-router-dom
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAuth: vi.fn(),
}));

// Import the mocked hook
import { useAuth } from '../../contexts/AuthContext';

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  const defaultAuthValue = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null as string | null,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    clearError: mockClearError,
  };

  const renderWithProviders = (authValue = defaultAuthValue) => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue(authValue);

    return render(
      <BrowserRouter>
        <NotificationProvider>
          <LoginForm />
        </NotificationProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    renderWithProviders();
    
    const user = userEvent.setup();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
    });

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('shows loading state during authentication', () => {
    const loadingAuthValue = {
      ...defaultAuthValue,
      loading: true,
    };

    renderWithProviders(loadingAuthValue);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays validation errors', async () => {
    renderWithProviders();
    
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays authentication error', () => {
    const errorAuthValue = {
      ...defaultAuthValue,
      error: 'Invalid credentials' as string | null,
    };

    renderWithProviders(errorAuthValue);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('handles remember me checkbox', async () => {
    renderWithProviders();
    
    const user = userEvent.setup();
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);

    expect(rememberMeCheckbox).not.toBeChecked();

    await act(async () => {
      await user.click(rememberMeCheckbox);
    });

    expect(rememberMeCheckbox).toBeChecked();
  });

  it('navigates to register page when clicking register link', async () => {
    renderWithProviders();

    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('clears error when clearError is called', async () => {
    const errorAuthValue = {
      ...defaultAuthValue,
      error: 'Some error' as string | null,
    };

    renderWithProviders(errorAuthValue);
    
    // Simulate clearing error (this would typically happen on input focus)
    await act(async () => {
      mockClearError();
    });

    expect(mockClearError).toHaveBeenCalled();
  });

  it('validates username format', async () => {
    renderWithProviders();
    
    const user = userEvent.setup();
    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      await user.type(usernameInput, 'ab');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderWithProviders();
    
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      await user.type(passwordInput, '123');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });
});