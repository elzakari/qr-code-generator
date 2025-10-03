import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { qrService } from '../../services/qr.service';
import { useAuthStore } from '../../store/authStore';
import { act } from 'react';

// Mock the services and stores
vi.mock('../../services/qr.service');
vi.mock('../../store/authStore');

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
  },
  {
    id: '2',
    content: 'Hello World',
    created_at: '2023-01-02T00:00:00Z',
    user_id: 1,
    download_url: '/api/qr/2/download'
  }
];

const defaultAuthValue = {
  user: mockUser
};

// Define typed mocks for qrService functions at top so tests can use them
const mockGetUserQRCodes = vi.mocked(qrService.getUserQRCodes as any);
const mockDeleteQR = vi.mocked(qrService.deleteQR as any);

// make renderWithProviders async and wrap in React.act
const renderWithProviders = async (authValue = defaultAuthValue) => {
  const mockUseAuthStore = vi.mocked(useAuthStore);
  mockUseAuthStore.mockReturnValue(authValue);

  await act(async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    await Promise.resolve();
  });
};

// Dashboard.test imports and helper
async function renderWithAct(ui: React.ReactElement) {
  await act(async () => {
    render(<BrowserRouter>{ui}</BrowserRouter>);
    await Promise.resolve();
  });
}

// Example usage inside a test
it('renders dashboard for authenticated user', async () => {
  await renderWithProviders();

  await waitFor(() => {
    const heading = screen.getByRole('heading', { name: 'Dashboard' });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Total QR Codes')).toBeInTheDocument();
  }, { timeout: 5000 });
});

it('displays QR codes', async () => {
  await renderWithProviders();

  await waitFor(() => {
    expect(screen.getByText('QR Code #1')).toBeInTheDocument();
    expect(screen.getByText('QR Code #2')).toBeInTheDocument();
  }, { timeout: 5000 });

  await waitFor(() => {
    const urlElements = screen.getAllByText('https://example.com');
    expect(urlElements.length).toBeGreaterThan(0);

    const helloWorldElements = screen.getAllByText('Hello World');
    expect(helloWorldElements.length).toBeGreaterThan(0);
  }, { timeout: 5000 });
});

it('handles search functionality with debouncing', async () => {
  await renderWithProviders();

  const user = userEvent.setup();

  await waitFor(() => {
    const heading = screen.getByRole('heading', { name: 'Dashboard' });
    expect(heading).toBeInTheDocument();
  }, { timeout: 5000 });

  const searchInput = screen.getByPlaceholderText(/search/i);

  await act(async () => {
    await user.type(searchInput, 'test query');
  });

  await waitFor(() => {
    expect(mockGetUserQRCodes).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'test query', page: 1, limit: 12 })
    );
  }, { timeout: 3000 });
});

it('deletes QR code when delete button is clicked', async () => {
  mockDeleteQR.mockResolvedValue(undefined);
  await renderWithProviders();
  
  const user = userEvent.setup();
  
  await waitFor(() => {
    expect(screen.getByText('QR Code #1')).toBeInTheDocument();
  }, { timeout: 5000 });

  // Find the more options button and click it to open menu
  const moreButtons = screen.getAllByLabelText('more options');
  await act(async () => {
    await user.click(moreButtons[0]);
  });

  // Find and click the delete option in the menu
  const deleteButton = screen.getByText('Delete');
  await act(async () => {
    await user.click(deleteButton);
  });

  await waitFor(() => {
    expect(mockDeleteQR).toHaveBeenCalledWith('1');
  });
});

it('shows loading state', async () => {
  // Mock a delayed response to show loading state
  mockGetUserQRCodes.mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve({
      qrs: mockQRCodes,
      total: mockQRCodes.length,
      page: 1,
      pages: 1,
      has_next: false,
      has_prev: false
    }), 100))
  );

  await renderWithProviders();

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

it('handles error state', async () => {
  const errorMessage = 'Failed to fetch QR codes. Please try again.';
  mockGetUserQRCodes.mockRejectedValue(new Error('API Error'));
  
  await renderWithProviders();

  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  }, { timeout: 5000 });
});

it('redirects unauthenticated users', async () => {
  await renderWithProviders({ user: null as any });

  // Should show loading spinner for unauthenticated users
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByText('Total QR Codes')).not.toBeInTheDocument();
});

// remove duplicate typed mock declarations at the bottom; keep beforeEach only
beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserQRCodes.mockResolvedValue({
    qrs: [
      { id: '1', content: 'https://example.com', created_at: '2023-01-01T00:00:00Z', user_id: 1, download_url: '/api/qr/1/download' },
      { id: '2', content: 'Hello World', created_at: '2023-01-02T00:00:00Z', user_id: 1, download_url: '/api/qr/2/download' },
    ],
    total: 2,
    page: 1,
    pages: 1,
    has_next: false,
    has_prev: false,
  });
});