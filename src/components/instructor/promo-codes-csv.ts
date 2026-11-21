import { format } from 'date-fns';
import { formatPromoDiscount, type PromoCode } from '@/components/instructor/PromoCodeForm';
import { toCsv } from '@/lib/utils/csv';

/** Mirrors the columns on the promo codes page, plus the raw values behind them. */
export const PROMO_CODE_CSV_HEADERS = [
  'Code',
  'Discount Type',
  'Discount',
  'Uses',
  'Max Uses',
  'Uses Remaining',
  'Expires',
  'Status',
] as const;

const DISCOUNT_TYPE_LABELS: Record<PromoCode['discountType'], string> = {
  PERCENTAGE: 'Percentage',
  FIXED: 'Fixed',
};

/** ISO date so spreadsheets sort it correctly; blank if the API sent junk. */
const formatExpiry = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
};

export const promoCodesToCsv = (promoCodes: PromoCode[]): string =>
  toCsv([
    [...PROMO_CODE_CSV_HEADERS],
    ...promoCodes.map((promo) => [
      promo.code,
      DISCOUNT_TYPE_LABELS[promo.discountType] ?? promo.discountType,
      formatPromoDiscount(promo),
      promo.currentUses,
      promo.maxUses,
      Math.max(promo.maxUses - promo.currentUses, 0),
      formatExpiry(promo.expiryDate),
      promo.isActive ? 'Active' : 'Inactive',
    ]),
  ]);

export const promoCodesCsvFilename = (date: Date = new Date()): string =>
  `promo-codes-${format(date, 'yyyy-MM-dd')}.csv`;
