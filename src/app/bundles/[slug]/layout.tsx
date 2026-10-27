import type { Metadata } from 'next';
import { bundlesApi } from '@/lib/api/services';
import { buildMetadata, siteConfig } from '@/lib/seo';
import type { Bundle } from '@/types';

type BundleLayoutProps = {
  children: React.ReactNode;
  params: { slug: string };
};

async function fetchBundleSafe(slug: string): Promise<Bundle | null> {
  if (!slug?.trim()) return null;
  try {
    const bundle = await bundlesApi.getBySlug(slug);
    return bundle ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const bundle = await fetchBundleSafe(params.slug);
  const path = `/bundles/${params.slug}`;

  if (!bundle) {
    return buildMetadata({
      title: 'Course Bundle',
      description: `Save on curated multi-course vocational learning bundles on ${siteConfig.name}.`,
      path,
    });
  }

  const courseCount = Array.isArray(bundle.courses) ? bundle.courses.length : 0;
  const fallbackDescription =
    courseCount > 0
      ? `Master ${bundle.title} with ${courseCount} curated courses on ${siteConfig.name}.`
      : `Explore the ${bundle.title} course bundle on ${siteConfig.name}.`;
  const description = bundle.description?.trim().slice(0, 300) || fallbackDescription;
  const images = bundle.thumbnailUrl ? [bundle.thumbnailUrl] : undefined;

  return buildMetadata({
    title: bundle.title,
    description,
    path: `/bundles/${bundle.slug || params.slug}`,
    images,
  });
}

export default function BundleDetailLayout({ children }: BundleLayoutProps) {
  return <>{children}</>;
}
