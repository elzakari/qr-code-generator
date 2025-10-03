import React from 'react';
// imports (remove unused React, ensure act is imported)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import QRGenerator from './QRGenerator';
import { qrService } from '../services/qr.service';
import { useQRStore } from '../store/qrStore';
import { useAuthStore } from '../store/authStore';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock the services and stores
vi.mock('../services/qr.service');
vi.mock('../store/qrStore');
vi.mock('../store/authStore');

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'user@example.com',
  role: 'User'
};

const mockQRStore = {
  addQR: vi.fn(),
  setLoading: vi.fn(),
  isLoading: false,
  recentQRs: []
};

const renderWithProviders = (authUser: typeof mockUser | null = mockUser, qrLoading = false) => {
  const mockUseAuthStore = vi.mocked(useAuthStore);
  const mockUseQRStore = vi.mocked(useQRStore);

  mockUseAuthStore.mockReturnValue({ user: authUser });
  mockUseQRStore.mockReturnValue({
    ...mockQRStore,
    isLoading: qrLoading,
  });

  return render(
    <BrowserRouter>
      <NotificationProvider>
        <QRGenerator />
      </NotificationProvider>
    </BrowserRouter>
  );
};

// Ensure service mocks exist for assertions
const mockGenerateQR = vi.mocked(qrService.generateQR);
const mockDownloadQR = vi.mocked(qrService.downloadQR);

describe('QRGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(qrService).generateQR = mockGenerateQR;
    vi.mocked(qrService).downloadQR = mockDownloadQR;

    mockGenerateQR.mockResolvedValue({
      id: '1',
      download_url: '/api/qr/1/download',
      data_uri: 'data:image/png;base64,mock',
      content: 'https://example.com',
      content_type: 'url',
      duplicates: [],
      total_generated: 2
    });

    const mockBlob = new Blob(['mock-image-data'], { type: 'image/png' });
    mockDownloadQR.mockResolvedValue(mockBlob);
  });

  it('renders QR generator form', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter URL, text, or any content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });
  });

  it('generates QR code successfully', async () => {
    renderWithProviders();

    const user = userEvent.setup();
    const contentInput = screen.getByPlaceholderText(/Enter URL, text, or any content/i);

    await user.clear(contentInput);
    await user.type(contentInput, 'https://example.com');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(mockGenerateQR).toHaveBeenCalledWith(expect.objectContaining({ content: 'https://example.com' }));
    });
  }, 10000);

  it('validates required content field', async () => {
    renderWithProviders();

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    // Find the content input field
    const contentInput = screen.getByLabelText(/QR Content/i);

    // First, add some content to the field
    await userEvent.type(contentInput, 'test content');
    
    // Then clear it to trigger validation
    await userEvent.clear(contentInput);
    
    // Trigger blur event to ensure validation runs
    await userEvent.tab();

    // Wait for validation error to appear
    await waitFor(
      () => {
        // Look for the helper text that contains the validation error
        const errorElement = screen.getByText('Content is required');
        expect(errorElement).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify that the QR generation service was NOT called due to validation failure
    expect(mockGenerateQR).not.toHaveBeenCalled();
  }, 10000);

  it('displays preview when QR is generated', async () => {
    renderWithProviders();
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const contentInput = screen.getByLabelText(/QR Content/i);

    await act(async () => {
      await userEvent.type(contentInput, 'test content');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  }, 10000);

  it('downloads QR code when download button is clicked', async () => {
    renderWithProviders();
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const contentInput = screen.getByLabelText(/QR Content/i);

    await act(async () => {
      await userEvent.type(contentInput, 'test content');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    // Wait for QR generation to complete and PNG download button to appear
    await waitFor(() => {
      const pngButton = screen.getByRole('button', { name: /png/i });
      expect(pngButton).toBeInTheDocument();
    }, { timeout: 10000 });

    const pngButton = screen.getByRole('button', { name: /png/i });
    
    await act(async () => {
      await userEvent.click(pngButton);
    });

    // Update expectation to match actual call signature
    expect(mockDownloadQR).toHaveBeenCalledWith('1', 'png');
  }, 15000);

  it('resets form after clicking reset', async () => {
    renderWithProviders();
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    });

    const contentInput = screen.getByLabelText(/QR Content/i);
    const resetButton = screen.getByRole('button', { name: /reset/i });

    await act(async () => {
      await userEvent.type(contentInput, 'test content');
    });

    // Verify content was typed
    await waitFor(() => {
      expect(contentInput).toHaveValue('test content');
    });

    await act(async () => {
      await userEvent.click(resetButton);
    });

    // Wait for form to reset
    await waitFor(() => {
      expect(contentInput).toHaveValue('');
    });

    // Check that placeholder is visible again
    await waitFor(() => {
      expect(contentInput).toHaveAttribute('placeholder', 'Enter URL, text, or any content for your QR code');
    });
  }, 10000);

  it('works for unauthenticated users', async () => {
    renderWithProviders(null); // No user
    
    await waitFor(() => {
      expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter URL, text, or any content/i)).toBeInTheDocument();
    });
  });
});