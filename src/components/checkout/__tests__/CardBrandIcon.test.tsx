import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardBrandIcon, cardBrandLabel, normalizeCardBrand } from '@/components/checkout/CardBrandIcon';

describe('normalizeCardBrand', () => {
  it.each([
    ['visa', 'visa'],
    ['Visa', 'visa'],
    ['MASTERCARD', 'mastercard'],
    ['MasterCard', 'mastercard'],
    ['American Express', 'amex'],
    ['Diners Club', 'diners'],
    ['UnionPay', 'unionpay'],
    ['eftpos_au', 'unknown'],
    ['', 'unknown'],
    [undefined, 'unknown'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeCardBrand(input as string | undefined)).toBe(expected);
  });
});

describe('CardBrandIcon', () => {
  it('renders the brand mark for display-name brands from saved cards', () => {
    render(<CardBrandIcon brand="American Express" />);
    expect(screen.getByRole('img', { name: 'American Express' })).toBeInTheDocument();
  });

  it('falls back to a generic card icon for unknown brands', () => {
    const { container } = render(<CardBrandIcon brand="eftpos_au" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(cardBrandLabel('eftpos_au')).toBe('Card');
  });
});
