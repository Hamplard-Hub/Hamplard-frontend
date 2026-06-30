'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FAQAccordion } from '@/components/ui/FAQAccordion';
import { cn } from '@/lib/utils';

type BillingPeriod = 'monthly' | 'annual';

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  ctaLabel: string;
  featured?: boolean;
  features: Array<{ label: string; included: boolean }>;
};

const plans: Plan[] = [
  {
    name: 'Free',
    description: 'Great for first-time learners building confidence with practical skills.',
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavings: 0,
    ctaLabel: 'Enroll free',
    features: [
      { label: 'Access to starter lessons', included: true },
      { label: 'Course progress tracking', included: true },
      { label: 'Community discussion access', included: true },
      { label: 'Certificate issuance', included: false },
      { label: 'Instructor feedback', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For ambitious students and instructors who want faster growth and deeper tools.',
    monthlyPrice: 19,
    annualPrice: 15,
    annualSavings: 20,
    ctaLabel: 'Get started',
    featured: true,
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Unlimited course access', included: true },
      { label: 'Verified certificates', included: true },
      { label: 'Instructor analytics', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

const faqs = [
  {
    question: 'Can I switch plans later?',
    answer:
      'Yes. You can upgrade anytime and keep your progress, certificates, and saved lessons intact.',
  },
  {
    question: 'Is the annual plan billed monthly or once?',
    answer:
      'Annual billing is charged once per year at the discounted rate, while monthly stays flexible month to month.',
  },
  {
    question: 'Do instructors get extra support on Pro?',
    answer:
      'Yes. Pro includes instructor analytics, learner engagement insights, and priority support to help you grow faster.',
  },
  {
    question: 'What happens if I am just getting started?',
    answer:
      'The Free plan gives you a strong foundation with starter lessons and progress tracking so you can try the platform without pressure.',
  },
];

export function PricingPlansSection({
  className,
  heading = 'Simple pricing for every learner and instructor',
  intro = 'Choose a plan that matches your pace, whether you are taking your first course or growing a full learning business.',
  showFAQ = true,
}: {
  className?: string;
  heading?: string;
  intro?: string;
  showFAQ?: boolean;
}) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');

  return (
    <div className={cn('w-full', className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[32px] border border-[#D5D2F6] bg-gradient-to-br from-[#F9F8FF] to-white p-6 shadow-[0_24px_80px_rgba(38,33,92,0.08)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D5D2F6] bg-white/80 px-3 py-1 text-sm font-medium text-[#5A5578]">
              <Sparkles className="h-4 w-4 text-[#7F77DD]" />
              Flexible plans for students and instructors
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">{heading}</h2>
            <p className="mt-3 text-base leading-7 text-[#5A5578] sm:text-lg">{intro}</p>
          </div>

          <div className="inline-flex rounded-full border border-[#D5D2F6] bg-white p-1 shadow-sm">
            {(['monthly', 'annual'] as BillingPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setBillingPeriod(period)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                  billingPeriod === period ? 'bg-[#26215C] text-white shadow' : 'text-[#5A5578] hover:bg-[#F4F2FF]',
                )}
              >
                {period === 'monthly' ? 'Monthly' : 'Annual'}
                {period === 'annual' ? ' · Save 20%' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const price = billingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isAnnual = billingPeriod === 'annual';
            const displayPrice = price === 0 ? 'Free' : `$${price}`;
            const priceSuffix = price === 0 ? '' : isAnnual ? '/mo' : '/mo';
            const badgeText = plan.featured ? 'Most popular' : 'Best for starters';

            return (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col rounded-[28px] border p-6 shadow-sm',
                  plan.featured ? 'bg-[#26215C] text-white' : 'border-[#D5D2F6] bg-white text-[#26215C]',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className={cn('text-2xl font-semibold', plan.featured ? 'text-white' : 'text-[#26215C]')}>{plan.name}</h3>
                    <p className={cn('mt-2 text-sm leading-6', plan.featured ? 'text-[#E8E5FF]' : 'text-[#5A5578]')}>{plan.description}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                      plan.featured ? 'bg-white/10 text-[#EEEDFE]' : 'bg-[#F4F2FF] text-[#7F77DD]',
                    )}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">{displayPrice}</span>
                  {price > 0 && <span className={cn('text-sm', plan.featured ? 'text-[#E8E5FF]' : 'text-[#5A5578]')}>{priceSuffix}</span>}
                </div>

                {isAnnual && plan.annualSavings > 0 && (
                  <p className={cn('mt-2 text-sm', plan.featured ? 'text-[#CFCBFF]' : 'text-[#7F77DD]')}>
                    Save {plan.annualSavings}% with annual billing.
                  </p>
                )}

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-3 text-sm leading-6">
                      {feature.included ? (
                        <span className={cn('mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full', plan.featured ? 'bg-white/15 text-white' : 'bg-[#E7E4FF] text-[#26215C]')}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className={cn('mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full', plan.featured ? 'bg-white/10 text-[#CFCBFF]' : 'bg-[#F4F2FF] text-[#7F77DD]')}>
                          <X className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className={plan.featured ? 'text-[#F4F2FF]' : 'text-[#5A5578]'}>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/signup" className="block">
                    <Button
                      variant={plan.featured ? 'primary' : 'secondary'}
                      size="lg"
                      className={cn(
                        'w-full justify-center',
                        plan.featured ? 'bg-white text-[#26215C] hover:bg-[#F4F2FF]' : 'bg-[#26215C] text-white hover:bg-[#3C3489]',
                      )}
                    >
                      {plan.ctaLabel}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {showFAQ && (
          <div className="rounded-[28px] border border-[#D5D2F6] bg-[#FAF9FF] p-6 sm:p-8">
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">Frequently asked questions</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#26215C]">Everything you need to know before you choose</h3>
            </div>
            <FAQAccordion items={faqs} />
          </div>
        )}
      </div>
    </div>
  );
}
