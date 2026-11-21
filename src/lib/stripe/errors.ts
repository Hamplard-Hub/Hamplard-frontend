import type { StripeError } from '@stripe/stripe-js';

/**
 * Stripe's raw messages are written for developers ("Your card was declined.")
 * and its decline codes are not surfaced to learners at all. Map both to copy
 * that says what happened and what to do next.
 */

/** Keyed on `error.decline_code` — only present when `code` is `card_declined`. */
const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds:
    "Your card doesn't have enough funds for this purchase. Try another card or top up and retry.",
  lost_card:
    'This card has been reported lost, so your bank blocked the payment. Please use a different card.',
  stolen_card:
    'This card has been reported stolen, so your bank blocked the payment. Please use a different card.',
  expired_card:
    'This card has expired. Check the expiry date, or use a different card.',
  incorrect_cvc:
    "The security code doesn't match this card. Re-enter the 3 digits from the back (4 on the front for Amex).",
  card_velocity_exceeded:
    'Your bank has blocked further charges on this card for now. Try again later or use a different card.',
  currency_not_supported:
    "This card can't be charged in US dollars. Please use a different card.",
  do_not_honor:
    'Your bank declined the payment without giving a reason. Contact your bank, or try a different card.',
  transaction_not_allowed:
    "Your bank doesn't allow this type of purchase on this card. Contact your bank, or try a different card.",
  fraudulent:
    'Your bank flagged this payment and blocked it. Contact your bank, or try a different card.',
  generic_decline:
    'Your bank declined this payment. Contact your bank for details, or try a different card.',
};

/** Keyed on `error.code` — used when there is no more specific decline code. */
const CODE_MESSAGES: Record<string, string> = {
  card_declined:
    'Your bank declined this payment. Contact your bank for details, or try a different card.',
  expired_card: 'This card has expired. Check the expiry date, or use a different card.',
  incorrect_cvc:
    "The security code doesn't match this card. Re-enter the 3 digits from the back (4 on the front for Amex).",
  invalid_cvc: 'That security code is not valid. Check the code on your card and try again.',
  incorrect_number: "That card number isn't valid. Check the digits and try again.",
  invalid_number: "That card number isn't valid. Check the digits and try again.",
  invalid_expiry_month: 'That expiry month is not valid. Use the MM / YY shown on your card.',
  invalid_expiry_year: 'That expiry year is not valid. Use the MM / YY shown on your card.',
  incomplete_number: 'Please finish entering your card number.',
  incomplete_expiry: 'Please enter the expiry date shown on your card.',
  incomplete_cvc: 'Please enter the security code from your card.',
  processing_error:
    'Something went wrong while processing your card. Wait a moment and try again — you have not been charged.',
  authentication_required:
    'Your bank needs to confirm it is really you. Approve the request in your banking app, then try again.',
  rate_limit: 'Too many attempts in a row. Please wait a moment and try again.',
  api_key_expired:
    'Card payments are temporarily unavailable. Please try again later or contact support.',
};

const FALLBACK_MESSAGE =
  "We couldn't process your payment. Please check your details and try again — you have not been charged.";

type PartialStripeError = Pick<StripeError, 'code' | 'decline_code' | 'type' | 'message'>;

/** Turn a Stripe error (or anything thrown by a payment handler) into learner-facing copy. */
export const friendlyStripeError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return FALLBACK_MESSAGE;

  const { code, decline_code: declineCode, type, message } = error as PartialStripeError;

  if (declineCode && DECLINE_MESSAGES[declineCode]) return DECLINE_MESSAGES[declineCode];
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  // Config and connectivity problems are our fault, not the learner's — don't
  // leak "No such API key" or a raw request id into the form.
  if (type === 'api_connection_error' || type === 'api_error' || type === 'authentication_error') {
    return 'Card payments are temporarily unavailable. Please try again in a moment or contact support.';
  }

  if (type === 'validation_error' && message) return message;

  return FALLBACK_MESSAGE;
};
