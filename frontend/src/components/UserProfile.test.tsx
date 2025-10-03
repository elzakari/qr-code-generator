import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from './UserProfile';
import { useAuthStore } from '../store/authStore';
import { useQRStore } from '../store/qrStore';

// Mock the stores
vi.mock('../store/authStore');
vi.mock('../store/qrStore');

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'user@example.com',
  role: 'User'
};

const mockQRCodes = [
  {
    id: '1',
    content: 'https://example.com',
    created_at: '2023-01-01T00:00:00Z',
    user_id: 1,
    download_url: '/api/qr/1/download'
  }
];

// Adjust store mock to match component usage
const renderWithProviders = (user: typeof mockUser | null = mockUser, recentQRs = mockQRCodes) => {
  const mockUseAuthStore = vi.mocked(useAuthStore);
  const mockUseQRStore = vi.mocked(useQRStore);

  mockUseAuthStore.mockReturnValue({ user });
  mockUseQRStore.mockReturnValue({
    recentQRs,
    loading: false,
    error: null,
    fetchUserQRCodes: vi.fn(),
  });

  return render(
    <BrowserRouter>
      <UserProfile />
    </BrowserRouter>
  );
};

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile for authenticated user', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('shows user profile when authenticated', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('shows recent QR codes section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Recent QR Codes')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
  });

  it('handles empty QR codes list', async () => {
    renderWithProviders(mockUser, []);

    await waitFor(() => {
      expect(screen.getByText('No recent QR codes')).toBeInTheDocument();
    });
  });

  it('shows settings section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
  });
});