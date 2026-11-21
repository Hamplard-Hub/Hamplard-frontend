import type { PaymentMethod } from '@stripe/stripe-js';

/**
 * Front-end-only stand-in for the confirmation step.
 *
 * Confirming a charge needs a PaymentIntent client secret from the backend,
 * which does not exist yet. Until it does, `PaymentForm` falls back to this so
 * the declined-card and success states are still reachable end to end: Stripe's
 * documented test cards are recognised by their last four digits and rejected
 * with the same shape a real confirmation error has.
 *
 * Swap it out by passing `onConfirmPayment` to `PaymentForm` once the
 * PaymentIntent endpoint lands.
 */

export class PaymentDeclinedError extends Error {
  readonly code: string;
  readonly decline_code?: string;

  constructor(code: string, declineCode?: string) {
    super(`Payment failed: ${declineCode ?? code}`);
    this.name = 'PaymentDeclinedError';
    this.code = code;
    this.decline_code = declineCode;
  }
}

/** https://docs.stripe.com/testing#declined-payments — keyed on the card's last4. */
const TEST_CARD_OUTCOMES: Record<string, { code: string; declineCode?: string }> = {
  '0002': { code: 'card_declined', declineCode: 'generic_decline' },
  '9995': { code: 'card_declined', declineCode: 'insufficient_funds' },
  '9987': { code: 'card_declined', declineCode: 'lost_card' },
  '9979': { code: 'card_declined', declineCode: 'stolen_card' },
  '0069': { code: 'expired_card' },
  '0127': { code: 'incorrect_cvc' },
  '0119': { code: 'processing_error' },
  '3220': { code: 'authentication_required' },
};

const PROCESSING_DELAY_MS = 1200;

export const simulatePaymentConfirmation = async (
  paymentMethod: PaymentMethod,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));

  const outcome = TEST_CARD_OUTCOMES[paymentMethod.card?.last4 ?? ''];
  if (outcome) throw new PaymentDeclinedError(outcome.code, outcome.declineCode);
};
