import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import { DISALLOWED_PATHS, buildMetadata } from '@/lib/seo';
import { metadata as checkoutMetadata } from '@/app/checkout/layout';
import { metadata as cartMetadata } from '@/app/cart/layout';
import { metadata as resetPasswordMetadata } from '@/app/reset-password/layout';
import { metadata as giftClaimMetadata } from '@/app/gift/claim/layout';

describe('SEO & Robots Configuration', () => {
  it('DISALLOWED_PATHS includes sensitive routes: gift-claim, checkout, cart, and reset-password', () => {
    expect(DISALLOWED_PATHS).toContain('/gift/claim');
    expect(DISALLOWED_PATHS).toContain('/checkout');
    expect(DISALLOWED_PATHS).toContain('/cart');
    expect(DISALLOWED_PATHS).toContain('/reset-password');
  });

  it('robots() function disallows all DISALLOWED_PATHS in robots.txt rules', () => {
    const robotsConfig = robots();
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
    const disallowList = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    expect(disallowList).toContain('/gift/claim');
    expect(disallowList).toContain('/checkout');
    expect(disallowList).toContain('/cart');
    expect(disallowList).toContain('/reset-password');
  });

  it('buildMetadata emits robots { index: false, follow: true } when noIndex is true', () => {
    const meta = buildMetadata({
      title: 'Private Page',
      path: '/private',
      noIndex: true,
    });

    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it('route layouts for sensitive paths emit noindex robots metadata', () => {
    expect(checkoutMetadata.robots).toEqual({ index: false, follow: true });
    expect(cartMetadata.robots).toEqual({ index: false, follow: true });
    expect(resetPasswordMetadata.robots).toEqual({ index: false, follow: true });
    expect(giftClaimMetadata.robots).toEqual({ index: false, follow: true });
  });
});
