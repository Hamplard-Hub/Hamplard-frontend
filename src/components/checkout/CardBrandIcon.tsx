import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Brand strings Stripe reports on `CardNumberElement` change events and on a
 * saved PaymentMethod's `card.brand`.
 */
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown';

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

/** Display names and spellings other APIs use for the same brands. */
const BRAND_ALIASES: Record<string, CardBrand> = {
  'american express': 'amex',
  american_express: 'amex',
  americanexpress: 'amex',
  'master card': 'mastercard',
  master_card: 'mastercard',
  'diners club': 'diners',
  diners_club: 'diners',
  dinersclub: 'diners',
  'union pay': 'unionpay',
  union_pay: 'unionpay',
};

/**
 * Map any brand string — Stripe's `visa`, a saved card's `Visa`, or
 * `American Express` — onto a known `CardBrand`, falling back to `unknown`.
 */
export const normalizeCardBrand = (brand: string | null | undefined): CardBrand => {
  const key = (brand ?? '').trim().toLowerCase();
  if (key in BRAND_LABELS) return key as CardBrand;
  return BRAND_ALIASES[key] ?? 'unknown';
};

export const cardBrandLabel = (brand: string): string =>
  BRAND_LABELS[normalizeCardBrand(brand)];

interface CardBrandIconProps {
  brand: string;
  className?: string;
}

/**
 * Simplified brand marks rather than the official logos — no network requests,
 * no asset licensing, and they stay legible at 32×20. The accessible name is on
 * the <svg> so screen readers announce the detected brand as it changes.
 */
export function CardBrandIcon({ brand: rawBrand, className }: CardBrandIconProps) {
  const brand = normalizeCardBrand(rawBrand);

  if (brand === 'unknown') {
    return (
      <CreditCard className={cn('h-5 w-8 shrink-0 text-ink-500', className)} aria-hidden="true" />
    );
  }

  const label = cardBrandLabel(brand);
  const clipId = `card-brand-clip-${brand}`;

  return (
    <svg
      viewBox="0 0 32 20"
      className={cn('h-5 w-8 shrink-0', className)}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <clipPath id={clipId}>
        <rect width="32" height="20" rx="3" />
      </clipPath>

      <g clipPath={`url(#${clipId})`}>
        {brand === 'visa' && (
          <>
            <rect width="32" height="20" fill="#1434CB" />
            <text
              x="16"
              y="14"
              textAnchor="middle"
              fontFamily="DM Sans, system-ui, sans-serif"
              fontSize="9"
              fontWeight="700"
              fill="#FFFFFF"
              letterSpacing="0.5"
            >
              VISA
            </text>
          </>
        )}

        {brand === 'mastercard' && (
          <>
            <rect width="32" height="20" fill="#16120E" />
            <circle cx="13" cy="10" r="6" fill="#EB001B" />
            <circle cx="19" cy="10" r="6" fill="#F79E1B" fillOpacity="0.9" />
          </>
        )}

        {brand === 'amex' && (
          <>
            <rect width="32" height="20" fill="#006FCF" />
            <text
              x="16"
              y="13.5"
              textAnchor="middle"
              fontFamily="DM Sans, system-ui, sans-serif"
              fontSize="7.5"
              fontWeight="700"
              fill="#FFFFFF"
              letterSpacing="0.3"
            >
              AMEX
            </text>
          </>
        )}

        {brand === 'discover' && (
          <>
            <rect width="32" height="20" fill="#F5F3EF" />
            <path d="M14 20h18v-7c-6 4-12 6-18 7Z" fill="#F26E21" />
            <text
              x="13"
              y="13"
              textAnchor="middle"
              fontFamily="DM Sans, system-ui, sans-serif"
              fontSize="6.5"
              fontWeight="700"
              fill="#16120E"
            >
              DISC
            </text>
          </>
        )}

        {brand === 'diners' && (
          <>
            <rect width="32" height="20" fill="#0079BE" />
            <circle cx="16" cy="10" r="6" fill="#FFFFFF" />
            <rect x="15" y="4" width="2" height="12" fill="#0079BE" />
          </>
        )}

        {brand === 'jcb' && (
          <>
            <rect width="32" height="20" fill="#F5F3EF" />
            <rect x="4" y="3" width="7" height="14" rx="2" fill="#0E4C96" />
            <rect x="12.5" y="3" width="7" height="14" rx="2" fill="#BE0F34" />
            <rect x="21" y="3" width="7" height="14" rx="2" fill="#1B8A3A" />
          </>
        )}

        {brand === 'unionpay' && (
          <>
            <rect width="32" height="20" fill="#E21836" />
            <rect x="11" width="10" height="20" fill="#00447C" />
            <rect x="21" width="11" height="20" fill="#007B84" />
          </>
        )}
      </g>
    </svg>
  );
}
