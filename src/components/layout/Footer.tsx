'use client';

import { useState } from 'react';

const footerSections = [
  {
    title: 'About',
    description:
      'Hamplard empowers ambitious learners across Africa with practical online courses in tailoring, makeup, baking, and photography.',
    links: [
      { label: 'Our story', href: '/#about' },
      { label: 'Careers', href: '/#careers' },
      { label: 'Partner with us', href: '/#partners' },
    ],
  },
  {
    title: 'Courses',
    links: [
      { label: 'All courses', href: '/dashboard/courses' },
      { label: 'Tailoring', href: '/dashboard/courses/1' },
      { label: 'Makeup', href: '/dashboard/courses/2' },
      { label: 'Baking', href: '/dashboard/courses/3' },
      { label: 'Photography', href: '/dashboard/courses/4' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Contact us', href: '#' },
      { label: 'FAQs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '#' },
      { label: 'Privacy policy', href: '#' },
      { label: 'Cookie policy', href: '#' },
      { label: 'Accessibility', href: '#' },
    ],
  },
];

const socialLinks = [
  { label: 'Twitter', href: '#', icon: 'M22.46 6c-.77.35-1.6.58-2.46.69a4.28 4.28 0 0 0 1.88-2.37 8.51 8.51 0 0 1-2.7 1.03 4.26 4.26 0 0 0-7.27 3.88A12.1 12.1 0 0 1 3.16 4.3a4.25 4.25 0 0 0 1.32 5.68 4.2 4.2 0 0 1-1.93-.53v.05a4.26 4.26 0 0 0 3.42 4.17 4.28 4.28 0 0 1-1.92.07 4.26 4.26 0 0 0 3.98 2.96A8.54 8.54 0 0 1 2 19.54a12.05 12.05 0 0 0 6.56 1.92c7.87 0 12.17-6.52 12.17-12.17 0-.19 0-.38-.01-.57A8.7 8.7 0 0 0 24 4.56a8.35 8.35 0 0 1-2.4.66 4.2 4.2 0 0 0 1.84-2.32z' },
  { label: 'Instagram', href: '#', icon: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Zm-5 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm5.5-9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z' },
  { label: 'Facebook', href: '#', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.2l.8-4H14V7a1 1 0 0 1 1-1h3V2Z' },
];

export function Footer() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState('English');

  return (
    <footer className="bg-[#26215C] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-saffron-300">Hamplard</p>
                <p className="text-sm leading-7 text-slate-200">
                  Hamplard empowers ambitious learners across Africa with practical online courses in tailoring, makeup, baking, and photography.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">Follow us</p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-saffron-300 hover:bg-saffron-500/10 hover:text-saffron-300"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d={social.icon} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {footerSections.map((section, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={section.title} className="space-y-3 border-t border-white/10 py-4 md:border-none md:py-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left md:hidden"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span className="text-sm font-semibold uppercase tracking-[0.24em] text-white">{section.title}</span>
                    <span className="text-xl text-slate-300">{isOpen ? '−' : '+'}</span>
                  </button>

                  <div className="hidden md:block">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">{section.title}</h2>
                    {section.description ? (
                      <p className="mt-4 text-sm leading-7 text-slate-200">{section.description}</p>
                    ) : null}
                    <ul className="mt-4 space-y-3">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="text-sm text-slate-200 transition hover:text-saffron-300"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${isOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mt-3">
                      {section.description ? (
                        <p className="text-sm leading-7 text-slate-200">{section.description}</p>
                      ) : null}
                      <ul className="space-y-3 pt-4">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              className="text-sm text-slate-200 transition hover:text-saffron-300"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        <div className="mt-10 border-t border-white/10 pt-8 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2 text-sm text-slate-300">
            <p>© {new Date().getFullYear()} Hamplard. All rights reserved.</p>
            <p className="text-xs text-slate-400">Designed for learners, creators, and small businesses across Africa.</p>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="rounded-2xl border border-white/10 bg-[#1d1a4c] px-3 py-2 text-sm text-white transition hover:border-saffron-300 focus:outline-none focus:ring-2 focus:ring-saffron-400/60"
              >
                <option>English</option>
                <option>Français</option>
                <option>Español</option>
                <option>Português</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
