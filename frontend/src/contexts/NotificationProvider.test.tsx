// NotificationProvider context tests
import { vi } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { NotificationProvider, useNotification } from '../components/common/NotificationProvider';

// Test component that uses the notification context
const TestComponent = () => {
  const { showNotification } = useNotification();
  return (
    <button onClick={() => showNotification('Test message', 'info', 1000)}>
      Show Notification
    </button>
  );
};

// Component that tries to use notification outside provider
const ComponentOutsideProvider = () => {
  useNotification();
  return <div>Should not render</div>;
};

// describe('NotificationProvider', ...) block
describe('NotificationProvider', () => {
  it('provides notification context to children', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByText('Show Notification')).toBeInTheDocument();
  });

  it('shows notification when showNotification is called', async () => {
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

  it('removes notification after timeout', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Trigger showing the notification
    const button = screen.getByText('Show Notification');
    await userEvent.click(button);

    // Wait for notification to appear
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Wait for notification to be removed automatically (1000ms timeout)
    await waitForElementToBeRemoved(() => screen.queryByText('Test message'), {
      timeout: 2000 // Give it extra time
    });
  }, 10000);

  it('throws error when used outside provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a component that uses the hook outside provider
    const TestComponentOutside = () => {
      useNotification();
      return <div>Should not render</div>;
    };

    expect(() => {
      render(<TestComponentOutside />);
    }).toThrow('useNotification must be used within a NotificationProvider');
    
    errorSpy.mockRestore();
  });
});