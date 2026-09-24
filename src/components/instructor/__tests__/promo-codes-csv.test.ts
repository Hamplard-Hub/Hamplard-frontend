import { describe, expect, it } from 'vitest';
import type { PromoCode } from '@/components/instructor/PromoCodeForm';
import {
  PROMO_CODE_CSV_HEADERS,
  promoCodesCsvFilename,
  promoCodesToCsv,
} from '@/components/instructor/promo-codes-csv';

const promo = (overrides: Partial<PromoCode> = {}): PromoCode => ({
  id: 'p1',
  code: 'SUMMER20',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  expiryDate: '2026-12-31T12:00:00.000Z',
  maxUses: 100,
  currentUses: 12,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('promoCodesToCsv', () => {
  it('starts with headers that mirror the promo code table', () => {
    const [header] = promoCodesToCsv([]).split('\r\n');
    expect(header).toBe(PROMO_CODE_CSV_HEADERS.join(','));
    expect(PROMO_CODE_CSV_HEADERS).toEqual(
      expect.arrayContaining(['Code', 'Discount', 'Uses', 'Expires', 'Status']),
    );
  });

  it('writes one row per code with type, value, remaining uses and expiry', () => {
    const rows = promoCodesToCsv([
      promo(),
      promo({
        id: 'p2',
        code: 'FLAT5',
        discountType: 'FIXED',
        discountValue: 5,
        maxUses: 10,
        currentUses: 10,
        isActive: false,
      }),
    ]).split('\r\n');

    expect(rows).toHaveLength(3);
    expect(rows[1]).toBe('SUMMER20,Percentage,20%,12,100,88,2026-12-31,Active');
    expect(rows[2]).toBe('FLAT5,Fixed,$5,10,10,0,2026-12-31,Inactive');
  });

  it('never reports negative uses remaining', () => {
    const [, row] = promoCodesToCsv([promo({ maxUses: 5, currentUses: 7 })]).split('\r\n');
    expect(row.split(',')[5]).toBe('0');
  });

  it('leaves the expiry blank when the date is invalid', () => {
    const [, row] = promoCodesToCsv([promo({ expiryDate: 'not-a-date' })]).split('\r\n');
    expect(row.split(',')[6]).toBe('');
  });
});

describe('promoCodesCsvFilename', () => {
  it('stamps the file with the export date', () => {
    expect(promoCodesCsvFilename(new Date(2026, 8, 24))).toBe('promo-codes-2026-09-24.csv');
  });
});
