import { OG_CONTENT_TYPE, OG_SIZE, renderSiteOgImage, SITE_OG_ALT } from '@/lib/og';

// Route config cannot be re-exported from opengraph-image.tsx — Next only reads
// statically declared exports — so the card is shared through @/lib/og instead.
export const runtime = 'edge';

export const alt = SITE_OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderSiteOgImage();
}
