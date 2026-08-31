import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import { ToastProvider } from '../ToastProvider';

describe('NetworkStatusBanner (Issue #180)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not render banner when online', () => {
    render(
      <ToastProvider>
        <NetworkStatusBanner />
      </ToastProvider>
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders offline banner when connection is lost', () => {
    render(
      <ToastProvider>
        <NetworkStatusBanner />
      </ToastProvider>
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByText(/You are offline. Some features may be unavailable./i)
    ).toBeInTheDocument();
  });

  it('allows manual dismissal of the offline banner', () => {
    render(
      <ToastProvider>
        <NetworkStatusBanner />
      </ToastProvider>
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    const dismissButton = screen.getByRole('button', {
      name: /dismiss offline banner/i,
    });
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('fires back online notification when reconnected', () => {
    render(
      <ToastProvider>
        <NetworkStatusBanner />
      </ToastProvider>
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText(/Back online!/i)).toBeInTheDocument();
  });
});
