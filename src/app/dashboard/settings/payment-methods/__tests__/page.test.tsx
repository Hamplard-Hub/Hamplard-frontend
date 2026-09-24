import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedPaymentMethod } from '@/types';

const { api, createPaymentMethod } = vi.hoisted(() => ({
  api: { list: vi.fn(), add: vi.fn(), remove: vi.fn(), setDefault: vi.fn() },
  createPaymentMethod: vi.fn(),
}));

vi.mock('@/lib/api/services', () => ({ paymentMethodsApi: api }));
vi.mock('@/lib/stripe/client', () => ({ isStripeConfigured: () => true, getStripe: async () => null }));

/** Stripe's CardElement lives in an iframe; a plain input emitting the same events stands in. */
vi.mock('@stripe/react-stripe-js', () => {
  const stripe = { createPaymentMethod };
  return {
    Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    CardElement: ({ onChange }: { onChange?: (event: unknown) => void }) => (
      <input
        data-testid="card-element"
        onChange={(event) => onChange?.({ complete: event.target.value === 'complete' })}
      />
    ),
    useStripe: () => stripe,
    useElements: () => ({ getElement: () => ({}) }),
  };
});

import PaymentMethodsPage from '../page';
import { ToastProvider } from '@/components/ui/ToastProvider';

const card = (overrides: Partial<SavedPaymentMethod> = {}): SavedPaymentMethod => ({
  id: 'pm_visa',
  brand: 'visa',
  last4: '4242',
  expMonth: 4,
  expYear: 2099,
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const MASTERCARD = card({
  id: 'pm_mc',
  brand: 'mastercard',
  last4: '4444',
  expMonth: 11,
  expYear: 2098,
  isDefault: false,
  createdAt: '2026-02-01T00:00:00.000Z',
});

const renderPage = () =>
  render(
    <ToastProvider>
      <PaymentMethodsPage />
    </ToastProvider>,
  );

const savedCards = () => within(screen.getByRole('list', { name: /saved cards/i })).getAllByRole('listitem');

describe('PaymentMethodsPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    createPaymentMethod.mockReset();
    api.list.mockResolvedValue([MASTERCARD, card()]);
    api.remove.mockResolvedValue(undefined);
    api.setDefault.mockResolvedValue(undefined);
  });

  it('lists saved cards with brand, last 4 and expiry, default first', async () => {
    renderPage();

    await screen.findByRole('list', { name: /saved cards/i });
    const [first, second] = savedCards();

    expect(within(first).getByRole('img', { name: 'Visa' })).toBeInTheDocument();
    expect(first).toHaveTextContent('4242');
    expect(first).toHaveTextContent('Expires 04/99');
    expect(within(first).getByText('Default')).toBeInTheDocument();

    expect(within(second).getByRole('img', { name: 'Mastercard' })).toBeInTheDocument();
    expect(second).toHaveTextContent('Expires 11/98');
    expect(within(second).queryByText('Default')).not.toBeInTheDocument();
  });

  it('flags expired cards', async () => {
    api.list.mockResolvedValue([card({ expMonth: 1, expYear: 2020 })]);
    renderPage();

    expect(await screen.findByText('Expired 01/20')).toBeInTheDocument();
  });

  it('shows an empty state when no cards are saved', async () => {
    api.list.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/no saved cards yet/i)).toBeInTheDocument();
  });

  it('adds a card through the modal and updates the list without reloading', async () => {
    api.list.mockResolvedValue([card()]);
    createPaymentMethod.mockResolvedValue({
      paymentMethod: {
        id: 'pm_amex',
        card: { brand: 'amex', last4: '0005', exp_month: 7, exp_year: 2097 },
      },
    });
    api.add.mockImplementation(async (payload) => ({
      ...payload,
      isDefault: false,
      createdAt: '2026-03-01T00:00:00.000Z',
    }));
    renderPage();
    await screen.findByRole('list', { name: /saved cards/i });

    fireEvent.click(screen.getAllByRole('button', { name: /add payment method/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /add payment method/i });
    fireEvent.change(within(dialog).getByLabelText(/cardholder name/i), { target: { value: 'Ada Tester' } });
    fireEvent.change(within(dialog).getByTestId('card-element'), { target: { value: 'complete' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save card/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(createPaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'card', billing_details: { name: 'Ada Tester' } }),
    );
    expect(api.add).toHaveBeenCalledWith({
      id: 'pm_amex',
      brand: 'amex',
      last4: '0005',
      expMonth: 7,
      expYear: 2097,
    });
    expect(savedCards()).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'American Express' })).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('refuses to save the same card twice', async () => {
    api.list.mockResolvedValue([card()]);
    createPaymentMethod.mockResolvedValue({
      paymentMethod: { id: 'pm_new', card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2099 } },
    });
    renderPage();
    await screen.findByRole('list', { name: /saved cards/i });

    fireEvent.click(screen.getByRole('button', { name: /add payment method/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/cardholder name/i), { target: { value: 'Ada' } });
    fireEvent.change(within(dialog).getByTestId('card-element'), { target: { value: 'complete' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save card/i }));

    expect(await within(dialog).findByText(/already saved/i)).toBeInTheDocument();
    expect(api.add).not.toHaveBeenCalled();
  });

  it('asks for confirmation before removing a card', async () => {
    renderPage();
    await screen.findByRole('list', { name: /saved cards/i });

    fireEvent.click(screen.getByRole('button', { name: /remove mastercard ending in 4444/i }));
    const dialog = screen.getByRole('alertdialog', { name: /remove this card/i });
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(savedCards()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /remove mastercard ending in 4444/i }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /remove card/i }));

    await waitFor(() => expect(savedCards()).toHaveLength(1));
    expect(api.remove).toHaveBeenCalledWith('pm_mc');
    expect(screen.queryByText('4444')).not.toBeInTheDocument();
  });

  it('changes the default card', async () => {
    renderPage();
    await screen.findByRole('list', { name: /saved cards/i });

    fireEvent.click(screen.getByRole('button', { name: /set mastercard ending in 4444 as default/i }));

    await waitFor(() => expect(within(savedCards()[0]).getByText('Default')).toBeInTheDocument());
    expect(api.setDefault).toHaveBeenCalledWith('pm_mc');
    expect(savedCards()[0]).toHaveTextContent('4444');
    expect(within(savedCards()[1]).queryByText('Default')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set visa ending in 4242 as default/i })).toBeInTheDocument();
  });
});
