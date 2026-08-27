import { TopBar } from "@/components/layout/TopBar";
import { HeroSection } from "@/components/layout/HeroSection";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { HomepageCarousels, RecentlyViewed } from "@/components/home";

const DEFAULT_OG_IMAGE = '/hamplard-og.svg';

export const metadata: Metadata = buildMetadata({
  title: 'Hamplard',
  description:
    "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
  openGraph: {
    title: 'Hamplard',
    description:
      "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
    url: '/',
    siteName: 'Hamplard',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, alt: 'Hamplard brand preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hamplard',
    description:
      "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
    images: [DEFAULT_OG_IMAGE],
  },
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <HeroSection />

      <section className="mx-auto max-w-[1280px] px-6 pt-12 xl:px-10">
        <RecentlyViewed />
      </section>

      {/* ── Course discovery carousels ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-12 xl:px-10">
        <HomepageCarousels />
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16 xl:px-10">
        <PricingPlansSection heading="Plans that support every stage of your learning journey" intro="Students can start with the Free plan and upgrade when they want deeper tools, while instructors can unlock analytics and better learner engagement with Pro." />
      </section>
    </div>
  );
}
