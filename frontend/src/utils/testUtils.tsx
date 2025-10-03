import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotificationProvider } from '../components/common/NotificationProvider';

// Mock AuthProvider for tests that don't need real auth
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={testTheme}>
        <NotificationProvider>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  is_admin: false,
};

export const mockAdminUser = {
  id: 2,
  username: 'admin',
  is_admin: true,
};

export const mockQRCode = {
  id: 'test-qr-1',
  content: 'https://example.com',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 1,
  download_url: 'https://example.com/download/test-qr-1',
};

export const mockQRFormData = {
  content: 'https://example.com',
  error_correction: 'M' as const,
  size_px: 200,
  box_size: 10,
  margin: 4,
  fg_color: '#000000',
  bg_color: '#ffffff',
  rounded: 0,
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };
export { customRender as renderWithProviders };