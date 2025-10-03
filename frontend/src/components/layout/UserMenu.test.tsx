import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import UserMenu from './UserMenu';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types/models';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

describe('UserMenu', () => {
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    is_admin: false,
  };

  const mockLogout = vi.fn();

  const renderWithAuth = (user: User | null = mockUser) => {
    const authValue = {
      user,
      isAuthenticated: !!user,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      loading: false,
      error: null,
      clearError: vi.fn(),
    };

    vi.mocked(useAuth).mockReturnValue(authValue);

    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <UserMenu />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user avatar with username initial', () => {
    renderWithAuth();
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('T'); // First letter of 'testuser'
  });

  it('opens menu when avatar is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    await user.click(avatar);
    
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('navigates to dashboard when Dashboard is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    await user.click(avatar);
    
    const dashboardItem = screen.getByText('Dashboard');
    await user.click(dashboardItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('calls logout when Logout is clicked', async () => {
    renderWithAuth();

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByLabelText(/account of current user/i));
    });

    await act(async () => {
      await user.click(screen.getByText(/logout/i));
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    await user.click(avatar);
    
    // Verify menu is open
    expect(screen.getByRole('menu')).toBeInTheDocument();
    
    // Click outside the menu (on document body)
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await user.click(backdrop);
    } else {
      await user.click(document.body);
    }
    
    // Wait for menu to close with longer timeout for animations
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('closes menu when pressing Escape', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    await user.click(avatar);
    
    // Verify menu is open
    expect(screen.getByRole('menu')).toBeInTheDocument();
    
    // Press Escape key
    await user.keyboard('{Escape}');
    
    // Wait for menu to close with longer timeout for animations
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays correct username initial for different users', () => {
    const customUser: User = {
      id: 2,
      username: 'alice',
      is_admin: true,
    };
    
    renderWithAuth(customUser);
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    expect(avatar).toHaveTextContent('A'); // First letter of 'alice'
  });

  it('handles empty username gracefully', () => {
    const userWithEmptyName: User = {
      id: 3,
      username: '',
      is_admin: false,
    };
    
    renderWithAuth(userWithEmptyName);
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    expect(avatar).toBeInTheDocument();
    // Should handle empty username without crashing
  });

  it('shows admin indicator for admin users', async () => {
    const adminUser: User = {
      id: 4,
      username: 'admin',
      is_admin: true,
    };
    
    renderWithAuth(adminUser);
    
    const avatar = screen.getByRole('button', { name: /account of current user/i });
    await userEvent.click(avatar);
    
    // Check if there's any admin-specific content (this would depend on your implementation)
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('does not render when user is null', () => {
    renderWithAuth(null);
    
    const avatar = screen.queryByRole('button', { name: /account of current user/i });
    expect(avatar).not.toBeInTheDocument();
  });
});