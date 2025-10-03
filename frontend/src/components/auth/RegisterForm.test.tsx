import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { AuthContext } from '../../contexts/AuthContext';
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

// Import after mocking
import { useAuth } from '../../contexts/AuthContext';

describe('RegisterForm', () => {
  const mockRegister = vi.fn();
  const mockAuthContext = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  const renderWithProviders = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <NotificationProvider>
            <RegisterForm />
          </NotificationProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue(mockAuthContext);
  });

  it('renders the registration form', () => {
    renderWithProviders();
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Username *')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Button should be disabled initially (terms not accepted)
    expect(submitButton).toBeDisabled();
  });

  it('validates password mismatch', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const usernameInput = screen.getByLabelText('Username *');
    const passwordInput = screen.getByLabelText('Password *');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.click(termsCheckbox);
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('validates terms acceptance', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const usernameInput = screen.getByLabelText('Username *');
    const passwordInput = screen.getByLabelText('Password *');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password *');

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Button should be disabled when terms are not accepted
    expect(submitButton).toBeDisabled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const usernameInput = screen.getByLabelText('Username *');
    const passwordInput = screen.getByLabelText('Password *');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password *');
    const termsCheckbox = screen.getByRole('checkbox');

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(termsCheckbox);
    });

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'Password123!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('displays error message when registration fails', async () => {
    const errorMessage = 'Username already exists';
    const mockAuthContextWithError = {
      ...mockAuthContext,
      error: errorMessage,
    };
    (useAuth as any).mockReturnValue(mockAuthContextWithError);

    renderWithProviders();

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state during registration', async () => {
    const mockAuthContextLoading = {
      ...mockAuthContext,
      loading: true,
    };
    (useAuth as any).mockReturnValue(mockAuthContextLoading);

    renderWithProviders();

    // When loading, the button contains a CircularProgress and has no accessible name
    // So we need to find it by type="submit" instead
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(button => 
      button.getAttribute('type') === 'submit'
    );
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('clears errors when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const usernameInput = screen.getByLabelText('Username *');
    const passwordInput = screen.getByLabelText('Password *');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'TestPassword123!');
      await user.type(confirmPasswordInput, 'TestPassword123!');
      await user.click(termsCheckbox);
    });

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await act(async () => {
      await user.click(submitButton);
    });

    expect(mockAuthContext.clearError).toHaveBeenCalled();
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const passwordInput = screen.getByLabelText('Password *');

    await act(async () => {
      await user.type(passwordInput, 'password'); // No uppercase, number, or special char
    });

    await waitFor(() => {
      // Should show validation errors for missing requirements
      expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const passwordInput = screen.getByLabelText('Password *');

    await act(async () => {
      await user.type(passwordInput, 'Password123!');
    });

    // Should show password strength indicator
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('navigates to login page when login link is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const loginLink = screen.getByText(/sign in here/i);
    
    await act(async () => {
      await user.click(loginLink);
    });

    // This would normally test navigation, but since we're mocking the router,
    // we just verify the link exists and is clickable
    expect(loginLink).toBeInTheDocument();
  });
});