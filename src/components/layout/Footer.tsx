'use client';

import Link from 'next/link';
import { useState } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
  {
    title: 'About Hamplard',
    links: [
      { label: 'Our story', href: '/#about' },
      { label: 'Careers', href: '/#careers' },
      { label: 'Partner with us', href: '/#partners' },
      { label: 'Blog', href: '/#blog' },
    ],
  },
  {
    title: 'Courses',
    links: [
      { label: 'All courses', href: '/dashboard/courses' },
      { label: 'Tailoring', href: '/dashboard/courses?category=tailoring' },
      { label: 'Makeup Artistry', href: '/dashboard/courses?category=makeup' },
      { label: 'Baking', href: '/dashboard/courses?category=baking' },
      { label: 'Photography', href: '/dashboard/courses?category=photography' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '/#help' },
      { label: 'Community', href: '/#community' },
      { label: 'Contact us', href: '/#contact' },
      { label: 'FAQs', href: '/#faqs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '/#terms' },
      { label: 'Privacy policy', href: '/#privacy' },
      { label: 'Cookie policy', href: '/#cookies' },
      { label: 'Accessibility', href: '/#accessibility' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/hamplard',
    // LinkedIn logo path
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/hamplard',
    // X / Twitter logo
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@hamplard',
    // YouTube logo path
    icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/hamplard',
    // Instagram logo path
    icon: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Zm-5 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm5.5-9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function Footer() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#26215C] text-white" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">

        {/* ── Brand + Social column (always visible, above columns on mobile) ── */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between lg:hidden">
          <div className="space-y-1">
            <p className="font-display text-xl font-semibold tracking-tight text-white">
              Hamplard
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              Empowering ambitious learners across Africa with practical online courses.
            </p>
          </div>
          <SocialRow />
        </div>

        {/* ── Desktop 4-column grid ── */}
        <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand column */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-display text-xl font-semibold tracking-tight text-white">
                Hamplard
              </p>
              <p className="text-sm leading-7 text-slate-300">
                Hamplard empowers ambitious learners across Africa with practical online courses
                in tailoring, makeup, baking, and photography.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Follow us
              </p>
              <SocialRow />
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {col.title}
              </h2>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Mobile accordion ── */}
        <div className="space-y-0 divide-y divide-white/10 lg:hidden">
          {FOOTER_COLUMNS.map((col, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={col.title}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`footer-section-${index}`}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-sm font-semibold text-white">{col.title}</span>
                  <span
                    className="text-lg leading-none text-slate-400 transition-transform duration-300"
                    aria-hidden="true"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>
                <div
                  id={`footer-section-${index}`}
                  className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? '16rem' : '0',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <ul className="space-y-3 pb-5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-slate-300 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 border-t border-white/10 pt-8 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © {currentYear} Hamplard. All rights reserved.
          </p>
          {/* Social row visible on mobile bottom bar */}
          <div className="mt-6 sm:mt-0 lg:hidden">
            <SocialRow />
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Social icon row ──────────────────────────────────────────────────────────

function SocialRow() {
  return (
    <div className="flex items-center gap-3" role="list" aria-label="Social media links">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow Hamplard on ${social.label}`}
          role="listitem"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:border-[#7F77DD] hover:bg-[#7F77DD]/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7F77DD]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
            focusable="false"
          >
            <path d={social.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
}
