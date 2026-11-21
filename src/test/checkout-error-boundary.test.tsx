import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutErrorBoundary } from '@/components/cart/CheckoutErrorBoundary';

function CrashingCheckout({ crash }: { crash: boolean }) {
  if (crash) throw new Error('payment provider unavailable');
  return <p>Checkout step 1</p>;
}

function CheckoutHarness() {
  const [crash, setCrash] = useState(true);
  return (
    <CheckoutErrorBoundary onReset={() => setCrash(false)}>
      <CrashingCheckout crash={crash} />
    </CheckoutErrorBoundary>
  );
}

describe('CheckoutErrorBoundary', () => {
  it('shows recovery actions and restarts checkout at step one', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CheckoutHarness />);

    expect(screen.getByRole('alert')).toHaveTextContent('Your cart is safe');
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      '/help',
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Checkout step 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
