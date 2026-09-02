'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { PricingTiers } from '@/components/teams/PricingTiers';
import { FAQAccordion, type FAQItem } from '@/components/ui/FAQAccordion';
import { useToastContext } from '@/components/ui/ToastProvider';
import {
  Users,
  CreditCard,
  UserPlus,
  BarChart3,
  Building2,
  CheckCircle2,
  Send,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: BarChart3,
    title: 'Team Progress Dashboard',
    description:
      'Track learning completion, course progress, and skill development metrics across your organization in real-time.',
  },
  {
    icon: CreditCard,
    title: 'Centralized Billing',
    description:
      'Simplify payments with one master invoice for all employee seats, supporting wire transfers, card payments, and corporate credit lines.',
  },
  {
    icon: UserPlus,
    title: 'Bulk Enrollment',
    description:
      'Invite team members effortlessly via CSV upload, corporate SSO, or domain-based auto-join rules.',
  },
  {
    icon: Users,
    title: 'Custom Skill Paths & Reporting',
    description:
      'Curate tailored learning paths for specific departments and export detailed compliance and performance reports.',
  },
];

const TEAM_FAQS: FAQItem[] = [
  {
    question: 'How does team seat licensing work?',
    answer:
      'Team seats can be assigned and re-assigned whenever employee roles change. Each employee gets unlimited access to all courses in the subscription.',
  },
  {
    question: 'Can we pay via bank transfer or invoice?',
    answer:
      'Yes, we support corporate invoices, ACH, wire transfers, and credit card payments for annual and semi-annual team plans.',
  },
  {
    question: 'Are custom learning paths supported?',
    answer:
      'Yes! For Growth and Enterprise plans, our learning team helps curate specific course tracks aligned with your internal skill goals.',
  },
  {
    question: 'Is there a minimum team size?',
    answer:
      'Our Starter Team plan begins at up to 10 employees. For smaller teams or custom headcounts, contact our sales team.',
  },
];

const LOGOS = [
  'TechCorp Africa',
  'Nexus Innovations',
  'CraftLabs Studio',
  'Apex Ventures',
  'Horizon Media',
];

export default function TeamsPage() {
  const toast = useToastContext();
  const formRef = useRef<HTMLDivElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('10-50');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollToForm = (preselectPlan?: string) => {
    if (preselectPlan) {
      setMessage((prev) =>
        prev
          ? `${prev}\nInterested in ${preselectPlan}`
          : `Interested in ${preselectPlan}`
      );
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company name is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success({
        title: 'Quote request submitted!',
        description: 'Our team will contact you within 24 business hours.',
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#26215C]">
      <Header />

      <main id="main-content">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F2FF] to-[#FAF9FF] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EEEDFE] px-4 py-1.5 text-xs font-semibold text-[#7F77DD]">
              <Building2 className="h-4 w-4" /> Hamplard for Business & Teams
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-extrabold tracking-tight text-[#26215C] sm:text-5xl lg:text-6xl">
              Upskill Your Entire Team
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5578]">
              Empower your workforce with hands-on, practical skill training in
              design, digital arts, technology, and vocational crafts. Boost
              retention and team productivity.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => scrollToForm()}
                className="rounded-2xl bg-[#7F77DD] px-8 py-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:bg-[#6860C7]"
              >
                Get a Quote
              </button>
              <a
                href="#pricing"
                className="rounded-2xl border border-[#D5D2F6] bg-white px-8 py-4 text-base font-semibold text-[#26215C] transition hover:bg-[#F4F2FF]"
              >
                View Plans & Pricing
              </a>
            </div>
          </div>
        </section>

        {/* ── Trusted By Logos ── */}
        <section className="border-y border-[#EEEDFE] bg-white py-10">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#5A5578]">
              Trusted by leading teams and organizations across Africa
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70">
              {LOGOS.map((name) => (
                <span
                  key={name}
                  className="font-display text-lg font-bold tracking-tight text-[#26215C]/80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits Section ── */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-extrabold text-[#26215C] sm:text-4xl">
                Why Companies Choose Hamplard
              </h2>
              <p className="mt-4 text-base text-[#5A5578]">
                Everything you need to deploy, manage, and evaluate team skill growth.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-3xl border border-[#D5D2F6] bg-white p-8 shadow-sm transition hover:shadow-md"
                  >
                    <div className="inline-flex rounded-2xl bg-[#F4F2FF] p-3 text-[#7F77DD]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-[#26215C]">
                      {b.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5A5578]">
                      {b.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pricing Tiers ── */}
        <section id="pricing" className="bg-[#F4F2FF]/60 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="font-display text-3xl font-extrabold text-[#26215C] sm:text-4xl">
                Flexible Team Pricing
              </h2>
              <p className="mt-4 text-base text-[#5A5578]">
                Choose the right seat package for your team or request a enterprise custom tier.
              </p>
            </div>

            <PricingTiers onSelectTier={(tier) => scrollToForm(tier)} />
          </div>
        </section>

        {/* ── Contact Form Section ── */}
        <section ref={formRef} className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="rounded-3xl border border-[#D5D2F6] bg-white p-8 shadow-md sm:p-12">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-[#26215C] sm:text-3xl">
                  Request a Corporate Quote
                </h2>
                <p className="mt-2 text-sm text-[#5A5578]">
                  Fill out the form below and our team learning specialist will respond within 24 hours.
                </p>
              </div>

              {isSubmitted ? (
                <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center text-emerald-900 border border-emerald-200">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                  <h3 className="mt-4 text-lg font-bold">Thank you for your inquiry!</h3>
                  <p className="mt-2 text-sm">
                    We have received your team quote request. A member of our team will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  {errorMsg ? (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                      {errorMsg}
                    </div>
                  ) : null}

                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-semibold text-[#26215C]"
                    >
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Tech Ltd"
                      className="mt-2 w-full rounded-xl border border-[#D5D2F6] px-4 py-3 text-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/20"
                      required
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="teamSize"
                        className="block text-sm font-semibold text-[#26215C]"
                      >
                        Team Size
                      </label>
                      <select
                        id="teamSize"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-[#D5D2F6] bg-white px-4 py-3 text-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/20"
                      >
                        <option value="1-10">1 – 10 employees</option>
                        <option value="10-50">10 – 50 employees</option>
                        <option value="50-200">50 – 200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="workEmail"
                        className="block text-sm font-semibold text-[#26215C]"
                      >
                        Work Email *
                      </label>
                      <input
                        id="workEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="mt-2 w-full rounded-xl border border-[#D5D2F6] px-4 py-3 text-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-[#26215C]"
                    >
                      Message / Custom Requirements
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your team skills goals or specific course tracks needed..."
                      className="mt-2 w-full rounded-xl border border-[#D5D2F6] px-4 py-3 text-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#6860C7] disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                    {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="bg-white py-20 lg:py-28 border-t border-[#EEEDFE]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-extrabold text-[#26215C]">
                Team Plans FAQ
              </h2>
              <p className="mt-2 text-sm text-[#5A5578]">
                Common questions about corporate onboarding and subscriptions.
              </p>
            </div>

            <FAQAccordion items={TEAM_FAQS} />
          </div>
        </section>
      </main>
    </div>
  );
}
