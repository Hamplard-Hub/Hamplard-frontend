import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/api/services', () => ({
  bundlesApi: {
    getBySlug: vi.fn(),
  },
}));

import { metadata as cartMetadata } from '@/app/cart/layout';
import { metadata as compareMetadata } from '@/app/compare/layout';
import { generateMetadata as generateBundleMetadata } from '@/app/bundles/[slug]/layout';
import { bundlesApi } from '@/lib/api/services';
import type { Bundle } from '@/types';

describe('Cart, Compare, and Bundle Page Metadata (#614)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('defines static noindex/nofollow metadata for /cart', () => {
    expect(cartMetadata.title).toBe('Shopping Cart');
    expect(cartMetadata.description).toContain('checkout on Hamplard');
    expect(cartMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it('defines static noindex/nofollow metadata for /compare', () => {
    expect(compareMetadata.title).toBe('Compare Courses');
    expect(compareMetadata.description).toContain('Compare Hamplard vocational courses');
    expect(compareMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it('generates dynamic title, description, and OpenGraph metadata for /bundles/[slug]', async () => {
    const mockBundle: Bundle = {
      id: 'bundle-1',
      slug: 'tailoring-mastery-pack',
      title: 'Tailoring Mastery Pack',
      description: 'Complete pattern drafting, bridal couture, and garment finishing bundle.',
      thumbnailUrl: 'https://cdn.hamplard.com/bundles/tailoring.jpg',
      totalValue: 150,
      bundlePrice: 99,
      courses: [],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    vi.mocked(bundlesApi.getBySlug).mockResolvedValueOnce(mockBundle);

    const metadata = await generateBundleMetadata({
      params: { slug: 'tailoring-mastery-pack' },
    });

    expect(bundlesApi.getBySlug).toHaveBeenCalledWith('tailoring-mastery-pack');
    expect(metadata.title).toBe('Tailoring Mastery Pack');
    expect(metadata.description).toBe(
      'Complete pattern drafting, bridal couture, and garment finishing bundle.',
    );
    expect(metadata.openGraph).toMatchObject({
      title: 'Tailoring Mastery Pack | Hamplard',
      description: 'Complete pattern drafting, bridal couture, and garment finishing bundle.',
      images: ['https://cdn.hamplard.com/bundles/tailoring.jpg'],
    });
  });

  it('falls back gracefully when bundle fetch fails or returns null', async () => {
    vi.mocked(bundlesApi.getBySlug).mockRejectedValueOnce(new Error('Not found'));

    const metadata = await generateBundleMetadata({
      params: { slug: 'missing-bundle' },
    });

    expect(metadata.title).toBe('Course Bundle');
    expect(metadata.description).toContain('curated multi-course vocational learning bundles');
    expect(metadata.openGraph).toMatchObject({
      title: 'Course Bundle | Hamplard',
    });
  });
});
