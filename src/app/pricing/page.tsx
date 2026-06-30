import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PricingPlansSection } from '@/components/pricing/PricingPlansSection';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the right plan for your learning journey on Hamplard.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 xl:px-10">
        <section className="overflow-hidden rounded-[32px] border border-[#D5D2F6] bg-gradient-to-br from-[#26215C] via-[#3C3489] to-[#7F77DD] px-8 py-12 text-white shadow-[0_24px_100px_rgba(38,33,92,0.2)] sm:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#E8E5FF]">Hamplard pricing</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn faster with a plan that grows with you.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#EEEDFE]">
              Students unlock practical lessons and verified certificates, while instructors gain better coaching tools and visibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-[#26215C] transition hover:bg-[#F4F2FF]">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/help" className="rounded-full border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                View help center
              </Link>
            </div>
          </div>
        </section>

        <PricingPlansSection className="pt-2" />
      </main>
    </div>
  );
}
