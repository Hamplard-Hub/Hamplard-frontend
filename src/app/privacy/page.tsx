import type { Metadata } from 'next';
import { TopBar } from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Hamplard handles your data and cookie preferences.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12 xl:px-10">
        <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">Privacy policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Your privacy matters to us.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#5A5578]">
            Hamplard uses cookies to keep the platform secure, remember your preferences, and improve your experience. You can review or change your choices at any time from the cookie settings.
          </p>
        </section>
      </main>
    </div>
  );
}
