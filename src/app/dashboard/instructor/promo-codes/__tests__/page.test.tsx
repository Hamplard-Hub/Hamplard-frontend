import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMy, downloadCsv } = vi.hoisted(() => ({ getMy: vi.fn(), downloadCsv: vi.fn() }));

vi.mock('@/lib/api/services', () => ({
  promoCodesApi: { getMy, create: vi.fn(), toggleActive: vi.fn() },
}));
vi.mock('@/lib/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/utils/csv')>()),
  downloadCsv,
}));

import PromoCodesPage from '../page';
import { PROMO_CODE_CSV_HEADERS } from '@/components/instructor/promo-codes-csv';

const PROMO = {
  id: 'p1',
  code: 'SUMMER20',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  expiryDate: '2099-12-31T12:00:00.000Z',
  maxUses: 100,
  currentUses: 12,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('PromoCodesPage CSV export', () => {
  beforeEach(() => {
    getMy.mockReset();
    downloadCsv.mockReset();
  });

  it('downloads the promo code list as a dated CSV', async () => {
    getMy.mockResolvedValue({ items: [PROMO] });
    render(<PromoCodesPage />);

    await screen.findByText('SUMMER20');
    const button = screen.getByRole('button', { name: /export csv/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [filename, csv] = downloadCsv.mock.calls[0];
    expect(filename).toMatch(/^promo-codes-\d{4}-\d{2}-\d{2}\.csv$/);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe(PROMO_CODE_CSV_HEADERS.join(','));
    expect(row).toBe('SUMMER20,Percentage,20%,12,100,88,2099-12-31,Active');
  });

  it('disables the export button when there are no promo codes', async () => {
    getMy.mockResolvedValue({ items: [] });
    render(<PromoCodesPage />);

    await screen.findByText(/no promo codes yet/i);
    const button = screen.getByRole('button', { name: /export csv/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(downloadCsv).not.toHaveBeenCalled();
  });
});
