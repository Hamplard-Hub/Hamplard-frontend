import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPaymentMethod, wallet } = vi.hoisted(() => {
  /** Stand-in for Stripe's PaymentRequest: records handlers so tests can fire them. */
  const handlers: Record<string, (event?: unknown) => unknown> = {};
  const request = {
    canMakePayment: vi.fn(),
    update: vi.fn(),
    on: vi.fn((type: string, handler: (event?: unknown) => unknown) => {
      handlers[type] = handler;
      return request;
    }),
    off: vi.fn((type: string) => {
      delete handlers[type];
      return request;
    }),
  };
  const createPaymentMethod = vi.fn();
  return {
    createPaymentMethod,
    wallet: {
      handlers,
      request,
      paymentRequest: vi.fn(() => request),
      // useStripe returns the same instance on every render, like the real hook.
      stripe: { createPaymentMethod, paymentRequest: vi.fn() },
    },
  };
});

/**
 * Stripe renders its fields in cross-origin iframes, which jsdom cannot host.
 * Stand them in with plain inputs that emit the same change-event shape, so the
 * form's own logic — brand detection, inline errors, submit states — is what is
 * under test.
 */
vi.mock('@stripe/react-stripe-js', () => {
  const brandOf = (value: string) => {
    if (value.startsWith('4')) return 'visa';
    if (value.startsWith('5')) return 'mastercard';
    if (value.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const stripeInput =
    (testId: string, withBrand: boolean) =>
    ({ onChange }: { onChange?: (event: unknown) => void }) =>
      React.createElement('input', {
        'data-testid': testId,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          const value = event.target.value;
          onChange?.({
            complete: value.startsWith('complete'),
            error: value.startsWith('error:') ? { message: value.slice(6) } : undefined,
            ...(withBrand ? { brand: brandOf(value.replace('complete', '')) } : {}),
          });
        },
      });

  return {
    CardNumberElement: stripeInput('card-number', true),
    CardExpiryElement: stripeInput('card-expiry', false),
    CardCvcElement: stripeInput('card-cvc', false),
    Elements: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    PaymentRequestButtonElement: ({
      onClick,
    }: {
      onClick?: (event: { preventDefault: () => void }) => void;
    }) =>
      React.createElement(
        'button',
        { type: 'button', onClick: () => onClick?.({ preventDefault: () => {} }) },
        'Wallet pay',
      ),
    useStripe: () => wallet.stripe,
    useElements: () => ({ getElement: () => ({}) }),
  };
});

vi.mock('@/lib/stripe/client', () => ({
  isStripeConfigured: () => true,
  getStripe: async () => null,
}));

import { PaymentForm, type PaymentFormProps } from '@/components/checkout/PaymentForm';

const PAYMENT_METHOD = { id: 'pm_test_123', card: { last4: '4242' } };

const renderForm = (props: Partial<PaymentFormProps> = {}) =>
  render(React.createElement(PaymentForm, { amount: 49.99, ...props }));

/** Fills every required field with valid values. */
const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/cardholder name/i), {
    target: { value: 'Ada Tester' },
  });
  fireEvent.change(screen.getByTestId('card-number'), {
    target: { value: 'complete4242424242424242' },
  });
  fireEvent.change(screen.getByTestId('card-expiry'), { target: { value: 'complete' } });
  fireEvent.change(screen.getByTestId('card-cvc'), { target: { value: 'complete' } });
  fireEvent.change(screen.getByLabelText(/street address/i), {
    target: { value: '12 Awolowo Road' },
  });
  fireEvent.change(screen.getByLabelText(/^city$/i), { target: { value: 'Lagos' } });
  fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '100001' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /pay \$/i }));

describe('PaymentForm', () => {
  beforeEach(() => {
    createPaymentMethod.mockReset();
    createPaymentMethod.mockResolvedValue({ paymentMethod: PAYMENT_METHOD });
    wallet.stripe.paymentRequest.mockReset();
    wallet.stripe.paymentRequest.mockImplementation(wallet.paymentRequest);
    wallet.request.canMakePayment.mockReset();
    // Most browsers have no wallet set up.
    wallet.request.canMakePayment.mockResolvedValue(null);
  });

  it('renders the card fields, PayPal alternative and secure payment badge', () => {
    renderForm({ amount: 129.49 });

    expect(screen.getByTestId('card-number')).toBeInTheDocument();
    expect(screen.getByTestId('card-expiry')).toBeInTheDocument();
    expect(screen.getByTestId('card-cvc')).toBeInTheDocument();
    expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /paypal/i })).toBeInTheDocument();
    expect(screen.getByText(/secured by stripe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay \$129\.49/i })).toBeInTheDocument();
  });

  it('updates the card brand icon as the number is entered', () => {
    renderForm();

    expect(screen.getByText(/detecting/i)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('card-number'), { target: { value: '4242' } });
    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('card-number'), { target: { value: '5555' } });
    expect(screen.getByRole('img', { name: 'Mastercard' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Visa' })).not.toBeInTheDocument();
  });

  it('shows validation errors from Stripe inline against the field', () => {
    renderForm();

    fireEvent.change(screen.getByTestId('card-number'), {
      target: { value: 'error:Your card number is invalid.' },
    });

    expect(screen.getByText('Your card number is invalid.')).toBeInTheDocument();
  });

  it('blocks submission and flags incomplete fields', async () => {
    renderForm();

    submit();

    expect(await screen.findByText(/enter the name printed on your card/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your full card number/i)).toBeInTheDocument();
    expect(createPaymentMethod).not.toHaveBeenCalled();
  });

  it('shows a processing spinner while the payment is in flight', async () => {
    let release!: () => void;
    const onConfirmPayment = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));

    renderForm({ onConfirmPayment });
    fillForm();
    submit();

    expect(await screen.findByText(/processing payment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing payment/i })).toBeDisabled();

    release();
    await waitFor(() => expect(screen.getByText(/payment successful/i)).toBeInTheDocument());
  });

  it('turns a declined card into a user-friendly message', async () => {
    const onConfirmPayment = vi
      .fn()
      .mockRejectedValue({ code: 'card_declined', decline_code: 'insufficient_funds' });

    renderForm({ onConfirmPayment });
    fillForm();
    submit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/payment not completed/i);
    expect(alert).toHaveTextContent(/enough funds/i);
    // Never the raw decline code.
    expect(alert).not.toHaveTextContent(/insufficient_funds/);
  });

  it('reports card errors raised while tokenising', async () => {
    createPaymentMethod.mockResolvedValue({ error: { code: 'expired_card', type: 'card_error' } });

    renderForm();
    fillForm();
    submit();

    expect(await screen.findByText(/this card has expired/i)).toBeInTheDocument();
  });

  it('passes the billing details Stripe needs when tokenising', async () => {
    renderForm({ onConfirmPayment: vi.fn().mockResolvedValue(undefined) });
    fillForm();
    submit();

    await waitFor(() => expect(createPaymentMethod).toHaveBeenCalled());
    expect(createPaymentMethod.mock.calls[0][0]).toMatchObject({
      type: 'card',
      billing_details: {
        name: 'Ada Tester',
        address: { line1: '12 Awolowo Road', city: 'Lagos', postal_code: '100001', country: 'NG' },
      },
    });
  });

  it('offers PayPal as an alternative to the card form', () => {
    const onPayPalSelected = vi.fn();
    renderForm({ onPayPalSelected });

    fireEvent.click(screen.getByRole('radio', { name: /paypal/i }));

    expect(screen.queryByTestId('card-number')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue to paypal/i }));
    expect(onPayPalSelected).toHaveBeenCalled();
  });

  describe('Apple Pay / Google Pay', () => {
    const WALLET_METHOD = { id: 'pm_wallet_123', card: { last4: '4242' } };

    /** Fires Stripe's `paymentmethod` event the way the wallet sheet would. */
    const payWithWallet = async () => {
      const complete = vi.fn();
      await act(async () => {
        await wallet.handlers.paymentmethod?.({ paymentMethod: WALLET_METHOD, complete });
      });
      return complete;
    };

    it('keeps the card form as the only option when no wallet is available', async () => {
      renderForm();

      await waitFor(() => expect(wallet.request.canMakePayment).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: /wallet pay/i })).not.toBeInTheDocument();
      expect(screen.getByTestId('card-number')).toBeInTheDocument();
    });

    it('does not offer Link-only support as a wallet', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: false, googlePay: false, link: true });
      renderForm();

      await waitFor(() => expect(wallet.request.canMakePayment).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: /wallet pay/i })).not.toBeInTheDocument();
    });

    it('renders the wallet button above the card form with the order total and currency', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: true, googlePay: false });
      renderForm({ amount: 129.49 });

      expect(await screen.findByRole('button', { name: /wallet pay/i })).toBeInTheDocument();
      expect(screen.getByText(/or pay with card/i)).toBeInTheDocument();
      expect(screen.getByTestId('card-number')).toBeInTheDocument();
      expect(wallet.stripe.paymentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
          total: expect.objectContaining({ amount: 12949 }),
          disableWallets: ['link', 'browserCard'],
        }),
      );
    });

    it('shows a spinner while the sheet is open and completes checkout on success', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: false, googlePay: true });
      const onConfirmPayment = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();
      renderForm({ onConfirmPayment, onSuccess });

      fireEvent.click(await screen.findByRole('button', { name: /wallet pay/i }));
      expect(screen.getByText(/waiting for google pay/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeDisabled();

      const complete = await payWithWallet();

      expect(onConfirmPayment).toHaveBeenCalledWith(WALLET_METHOD);
      expect(complete).toHaveBeenCalledWith('success');
      expect(onSuccess).toHaveBeenCalledWith(WALLET_METHOD);
      expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
      expect(createPaymentMethod).not.toHaveBeenCalled();
    });

    it('surfaces wallet failures in the same error UI as card payments', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: true });
      const onConfirmPayment = vi
        .fn()
        .mockRejectedValue({ code: 'card_declined', decline_code: 'insufficient_funds' });
      const onSuccess = vi.fn();
      renderForm({ onConfirmPayment, onSuccess });

      fireEvent.click(await screen.findByRole('button', { name: /wallet pay/i }));
      const complete = await payWithWallet();

      expect(complete).toHaveBeenCalledWith('fail');
      expect(onSuccess).not.toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/payment not completed/i);
      expect(alert).toHaveTextContent(/enough funds/i);
      expect(screen.queryByText(/waiting for apple pay/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeEnabled();
    });

    it('clears the spinner when the learner cancels the sheet', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: true });
      renderForm();

      fireEvent.click(await screen.findByRole('button', { name: /wallet pay/i }));
      expect(screen.getByText(/waiting for apple pay/i)).toBeInTheDocument();

      act(() => {
        wallet.handlers.cancel?.();
      });

      expect(screen.queryByText(/waiting for apple pay/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pay \$/i })).toBeEnabled();
    });

    it('keeps the wallet total in sync when the order amount changes', async () => {
      wallet.request.canMakePayment.mockResolvedValue({ applePay: true });
      const { rerender } = renderForm({ amount: 10 });
      await screen.findByRole('button', { name: /wallet pay/i });

      rerender(React.createElement(PaymentForm, { amount: 25.5 }));

      await waitFor(() =>
        expect(wallet.request.update).toHaveBeenLastCalledWith({
          total: expect.objectContaining({ amount: 2550 }),
        }),
      );
    });
  });
});
