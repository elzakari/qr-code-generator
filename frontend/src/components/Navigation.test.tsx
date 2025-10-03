// Navigation tests
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Navigation from './Navigation';
import { useAuthStore } from '../store/authStore';
import { vi } from 'vitest';

// Mock the auth store
vi.mock('../store/authStore');
const mockUseAuthStore = vi.mocked(useAuthStore);

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Navigation', () => {
  const mockUser = { id: 1, username: 'testuser', is_admin: false };
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      error: null
    });
  });

  it('renders navigation when user is authenticated', () => {
    renderWithProviders(<Navigation />);
    
    expect(screen.getByText('QR Generator')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('opens profile menu when avatar is clicked', async () => {
    renderWithProviders(<Navigation />);

    const user = userEvent.setup();
    const avatarButton = screen.getByLabelText('account of current user');
    await act(async () => {
      await user.click(avatarButton);
    });

    expect(screen.getByText('Profile & Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls logout when logout menu item is clicked', async () => {
    renderWithProviders(<Navigation />);

    const user = userEvent.setup();
    const avatarButton = screen.getByLabelText('account of current user');
    await act(async () => {
      await user.click(avatarButton);
    });

    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      await user.click(logoutButton);
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});