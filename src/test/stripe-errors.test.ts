import { describe, expect, it } from 'vitest';
import { friendlyStripeError } from '@/lib/stripe/errors';
import { PaymentDeclinedError, simulatePaymentConfirmation } from '@/lib/stripe/simulate';

describe('friendlyStripeError', () => {
  it('prefers the decline code over the generic card_declined message', () => {
    const message = friendlyStripeError({
      code: 'card_declined',
      decline_code: 'lost_card',
      message: 'Your card was declined.',
    });

    expect(message).toMatch(/reported lost/i);
  });

  it('falls back to the error code when there is no decline code', () => {
    expect(friendlyStripeError({ code: 'incorrect_cvc' })).toMatch(/security code/i);
  });

  it('hides infrastructure failures behind a neutral message', () => {
    const message = friendlyStripeError({
      type: 'authentication_error',
      message: 'Invalid API Key provided: sk_test_***',
    });

    expect(message).toMatch(/temporarily unavailable/i);
    expect(message).not.toMatch(/API Key/i);
  });

  it('never returns an empty string for unknown failures', () => {
    expect(friendlyStripeError(new Error('boom'))).toMatch(/couldn't process your payment/i);
    expect(friendlyStripeError(undefined)).toMatch(/couldn't process your payment/i);
  });
});

describe('simulatePaymentConfirmation', () => {
  it('resolves for a card that is not a declined test card', async () => {
    await expect(
      simulatePaymentConfirmation({ id: 'pm_1', card: { last4: '4242' } } as never),
    ).resolves.toBeUndefined();
  });

  it('rejects Stripe test cards with the matching decline code', async () => {
    const error = await simulatePaymentConfirmation({
      id: 'pm_2',
      card: { last4: '9995' },
    } as never).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(PaymentDeclinedError);
    expect(error.code).toBe('card_declined');
    expect(error.decline_code).toBe('insufficient_funds');
    expect(friendlyStripeError(error)).toMatch(/enough funds/i);
  });
});
