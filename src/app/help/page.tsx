import type { Metadata } from 'next';
import { TopBar } from '@/components/layout/TopBar';
import { FAQAccordion } from '@/components/ui/FAQAccordion';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find quick answers about learning, billing, and certificates on Hamplard.',
};

const helpItems = [
  {
    question: 'How do I enroll in a course?',
    answer: 'Open any course detail page, select Enroll, and follow the guided checkout to start learning.',
  },
  {
    question: 'How do I receive my certificate?',
    answer: 'Complete the course requirements and the certificate will appear in your dashboard once it is verified.',
  },
  {
    question: 'Can I switch between free and Pro?',
    answer: 'Yes. You can upgrade or downgrade whenever you need, and your learning history stays with your account.',
  },
  {
    question: 'What if I need support?',
    answer: 'You can reach our support team through the help center and our priority support is included on Pro.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 xl:px-10">
        <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">Help center</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Common questions, answered clearly.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5A5578]">
            Whether you are a student, instructor, or new to the platform, these answers will help you get moving quickly.
          </p>
        </section>

        <section className="rounded-[32px] border border-[#D5D2F6] bg-[#FAF9FF] p-6 sm:p-8">
          <FAQAccordion items={helpItems} />
        </section>
      </main>
    </div>
  );
}
