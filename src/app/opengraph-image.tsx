import { OG_CONTENT_TYPE, OG_SIZE, renderSiteOgImage, SITE_OG_ALT } from '@/lib/og';

// ImageResponse must run on the edge runtime: under Node, @vercel/og resolves its
// bundled font through fileURLToPath and throws ERR_INVALID_URL on Windows.
export const runtime = 'edge';

export const alt = SITE_OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderSiteOgImage();
}
