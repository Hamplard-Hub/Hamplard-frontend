'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PricingTier = {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  price: string;
  period: string;
  teamSize: string;
  features: string[];
  ctaLabel: string;
  popular?: boolean;
};

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Team',
    tagline: 'Ideal for small teams and startups launching skill development.',
    price: '$299',
    period: '/ month',
    teamSize: 'Up to 10 employees',
    features: [
      'Access to all 100+ skill courses',
      'Basic team progress dashboard',
      'Centralized billing & invoice payment',
      'Downloadable course certificates',
      'Standard email support',
    ],
    ctaLabel: 'Get Starter Quote',
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    badge: 'Most Popular',
    popular: true,
    tagline: 'Best for growing companies expanding upskilling programs.',
    price: '$799',
    period: '/ month',
    teamSize: 'Up to 50 employees',
    features: [
      'Everything in Starter Team',
      'Bulk enrollment & CSV team invites',
      'Advanced analytics & reporting export',
      'Custom learning path recommendations',
      'Dedicated account manager',
      'Priority 24/7 support',
    ],
    ctaLabel: 'Get Growth Quote',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom solutions tailored for large organizations and institutions.',
    price: 'Custom',
    period: 'pricing',
    teamSize: 'Unlimited employees',
    features: [
      'Everything in Growth Plan',
      'Custom course development & branding',
      'Single Sign-On (SSO) & LMS integration',
      'Custom SLA & uptime guarantees',
      'Dedicated learning success strategist',
      'Quarterly executive reviews',
    ],
    ctaLabel: 'Contact Sales',
  },
];

type PricingTiersProps = {
  onSelectTier?: (tierName: string) => void;
};

export function PricingTiers({ onSelectTier }: PricingTiersProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {TIERS.map((tier) => (
        <div
          key={tier.id}
          className={cn(
            'relative flex flex-col justify-between rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md',
            tier.popular
              ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/20'
              : 'border-[#D5D2F6]'
          )}
        >
          {tier.badge ? (
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7F77DD] px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
              {tier.badge}
            </span>
          ) : null}

          <div>
            <h3 className="text-xl font-bold text-[#26215C]">{tier.name}</h3>
            <p className="mt-2 text-sm text-[#5A5578]">{tier.tagline}</p>

            <div className="my-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-[#26215C]">
                {tier.price}
              </span>
              <span className="text-sm font-medium text-[#5A5578]">
                {tier.period}
              </span>
            </div>

            <div className="mb-6 inline-block rounded-full bg-[#F4F2FF] px-3 py-1 text-xs font-semibold text-[#26215C]">
              {tier.teamSize}
            </div>

            <ul className="space-y-3 border-t border-[#EEEDFE] pt-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#26215C]">
                  <Check className="h-5 w-5 shrink-0 text-[#7F77DD]" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4">
            <button
              type="button"
              onClick={() => onSelectTier?.(tier.name)}
              className={cn(
                'w-full rounded-xl py-3 text-center text-sm font-semibold transition duration-200',
                tier.popular
                  ? 'bg-[#7F77DD] text-white hover:bg-[#6860C7] shadow-sm'
                  : 'border border-[#7F77DD] bg-white text-[#26215C] hover:bg-[#F4F2FF]'
              )}
            >
              {tier.ctaLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
