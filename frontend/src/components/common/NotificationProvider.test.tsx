// NotificationProvider component tests
import React from 'react';
import { vi } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { NotificationProvider, useNotification } from './NotificationProvider';

// Test component that uses the notification hook
const TestComponent = () => {
  const { showNotification } = useNotification();
  
  return (
    <button onClick={() => showNotification('Test message', 'success')}>
      Show Notification
    </button>
  );
};

// Component that throws error when used outside provider
const ComponentOutsideProvider = () => {
  useNotification(); // This should throw
  return <div>Should not render</div>;
};

// New helper test components for different notification types
const ErrorTestComponent = () => {
  const { showNotification } = useNotification();
  return (
    <button onClick={() => showNotification('Error message', 'error')}>
      Show Error
    </button>
  );
};

const WarningTestComponent = () => {
  const { showNotification } = useNotification();
  return (
    <button onClick={() => showNotification('Warning message', 'warning')}>
      Show Warning
    </button>
  );
};

const InfoTestComponent = () => {
  const { showNotification } = useNotification();
  return (
    <button onClick={() => showNotification('Info message', 'info')}>
      Show Info
    </button>
  );
};

describe('NotificationProvider', () => {
  it('renders without crashing', () => {
    render(
      <NotificationProvider>
        <div>Test content</div>
      </NotificationProvider>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('shows success notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
  
    const user = userEvent.setup();
    const button = screen.getByText('Show Notification');
    await act(async () => {
      await user.click(button);
    });
  
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows error notification', async () => {
    render(
      <NotificationProvider>
        <ErrorTestComponent />
      </NotificationProvider>
    );
  
    const user = userEvent.setup();
    const button = screen.getByText('Show Error');
    await act(async () => {
      await user.click(button);
    });
  
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows warning notification', async () => {
    render(
      <NotificationProvider>
        <WarningTestComponent />
      </NotificationProvider>
    );
  
    const user = userEvent.setup();
    const button = screen.getByText('Show Warning');
    await act(async () => {
      await user.click(button);
    });
  
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('shows info notification', async () => {
    render(
      <NotificationProvider>
        <InfoTestComponent />
      </NotificationProvider>
    );
  
    const user = userEvent.setup();
    const button = screen.getByText('Show Info');
    await act(async () => {
      await user.click(button);
    });
  
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useNotification())).toThrow(
        'useNotification must be used within a NotificationProvider'
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
  it('throws error when used outside provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useNotification())).toThrow(
        'useNotification must be used within a NotificationProvider'
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});