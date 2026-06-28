"use client";

import Link from "next/link";
import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Column {
  heading: string;
  links: { label: string; href: string }[];
}

// ── Data ───────────────────────────────────────────────────────────────────
const columns: Column[] = [
  {
    heading: "About Hamplard",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Meet the Team", href: "/about/team" },
      { label: "Press & Media", href: "/press" },
      { label: "From the Blog", href: "/blog" },
    ],
  },
  {
    heading: "Courses",
    links: [
      { label: "Explore All Courses", href: "/courses" },
      { label: "Get Certified", href: "/courses/certifications" },
      { label: "Train Your Team", href: "/teams" },
      { label: "Curated Learning Paths", href: "/paths" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "Talk to Us", href: "/contact" },
      { label: "Join the Community", href: "/community" },
      { label: "Platform Status", href: "/status" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Refund Policy", href: "/legal/refunds" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

const trustBadges = [
  {
    label: "Industry-recognised certifications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Free courses available",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "50k+ active learners",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Learn at your own pace",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const socials = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/hamplard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/hamplard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@hamplard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "#26215C",
        color: "#fff",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        width: "100%",
      }}
    >
      <style>{`
        /* ── Newsletter ── */
        .footer-newsletter {
          background: #1e1a50;
          padding: 52px 40px 44px;
        }
        .footer-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9b8ff5;
          margin-bottom: 10px;
        }
        .footer-nl-heading {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .footer-nl-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .footer-nl-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
        }
        .footer-nl-input {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 11px 14px;
          color: #fff;
          font-size: 14px;
          outline: none;
          width: 100%;
          font-family: inherit;
        }
        .footer-nl-input::placeholder {
          color: rgba(255,255,255,0.35);
        }
        .footer-nl-input:focus {
          border-color: rgba(155,143,245,0.6);
        }
        .footer-nl-btn {
          background: #fff;
          color: #26215C;
          border: none;
          border-radius: 6px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-start;
          letter-spacing: 0.01em;
          font-family: inherit;
          transition: background 0.15s;
        }
        .footer-nl-btn:hover {
          background: #e8e4ff;
        }

        /* ── Trust strip ── */
        .footer-trust {
          background: #211d55;
          border-top: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 18px 40px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px 32px;
        }
        .footer-trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,0.55);
          font-size: 13px;
        }
        .footer-trust-icon {
          color: rgba(255,255,255,0.45);
          flex-shrink: 0;
          display: flex;
        }
        .footer-trust-divider {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,0.12);
          flex-shrink: 0;
        }

        /* ── Body ── */
        .footer-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 52px 40px 40px;
        }

        /* ── Brand ── */
        .footer-brand {
          margin-bottom: 44px;
        }
        .footer-brand-tagline {
          margin-top: 14px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        .footer-brand-desc {
          margin-top: 8px;
          font-size: 13.5px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          max-width: 300px;
        }
        .footer-brand-cta {
          margin-top: 10px;
          font-size: 13.5px;
          color: #9b8ff5;
          font-style: italic;
          font-weight: 500;
        }

        /* ── Desktop 4-column grid ── */
        .footer-desktop-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }
        .footer-mobile-accordion {
          display: none;
        }

        .footer-col-heading {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0 0 18px 0;
        }
        .footer-col-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .footer-col-links a {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 14px;
          line-height: 1.4;
          transition: color 0.15s;
        }
        .footer-col-links a:hover {
          color: #fff;
        }

        /* ── Mobile accordion ── */
        .footer-mobile-accordion details {
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .footer-mobile-accordion details:first-of-type {
          border-top: 1px solid rgba(255,255,255,0.12);
        }
        .footer-mobile-accordion summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          list-style: none;
          cursor: pointer;
          padding: 16px 0;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          user-select: none;
        }
        .footer-mobile-accordion summary::-webkit-details-marker { display: none; }
        .footer-mobile-accordion summary::marker { display: none; }
        .footer-mobile-accordion details[open] .footer-chevron {
          transform: rotate(180deg);
        }
        .footer-chevron {
          transition: transform 0.2s ease;
          flex-shrink: 0;
          line-height: 1;
        }
        .footer-mobile-accordion .footer-acc-links {
          list-style: none;
          margin: 0;
          padding: 0 0 16px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-mobile-accordion .footer-acc-links a {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 14px;
          line-height: 1.5;
        }
        .footer-mobile-accordion .footer-acc-links a:hover {
          color: #fff;
        }

        /* ── Bottom bar ── */
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 22px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .footer-copyright {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .footer-socials {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .footer-social-btn:hover {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        /* ── Responsive ── */
        @media (max-width: 767px) {
          .footer-newsletter { padding: 40px 20px 36px; }
          .footer-trust { padding: 16px 20px; gap: 12px 20px; }
          .footer-trust-divider { display: none; }
          .footer-body { padding: 40px 20px 32px; }
          .footer-desktop-grid { display: none; }
          .footer-mobile-accordion { display: block; }
          .footer-bottom { padding: 20px; }
        }
      `}</style>

      {/* ── Newsletter ── */}
      <div className="footer-newsletter">
        <p className="footer-eyebrow">Stay in the loop</p>
        <h2 className="footer-nl-heading">Insights delivered to your inbox</h2>
        <p className="footer-nl-sub">
          Course drops, career tips, and learner stories — no noise, no spam.
        </p>
        <div className="footer-nl-form">
          <input
            className="footer-nl-input"
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <button className="footer-nl-btn" type="button">
            Subscribe
          </button>
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div className="footer-trust">
        {trustBadges.map((badge, i) => (
          <React.Fragment key={badge.label}>
            {i !== 0 && <div className="footer-trust-divider" aria-hidden="true" />}
            <div className="footer-trust-item">
              <span className="footer-trust-icon" aria-hidden="true">
                {badge.icon}
              </span>
              {badge.label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="footer-body">

        {/* Brand block */}
        <div className="footer-brand">
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #7C6FE0 0%, #A78BFA 100%)",
                borderRadius: "8px",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              H
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              Hamplard
            </span>
          </Link>
          <p className="footer-brand-tagline">Where ambition meets education.</p>
          <p className="footer-brand-desc">
            Hamplard Hub is your launchpad for world-class courses,
            industry-recognised certifications, and a community of learners who
            refuse to stand still.
          </p>
          <p className="footer-brand-cta">
            Level up — at your own pace, on your own terms.
          </p>
        </div>

        {/* Desktop 4-column grid */}
        <div className="footer-desktop-grid">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="footer-col-heading">{col.heading}</h3>
              <ul className="footer-col-links">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile accordion */}
        <div className="footer-mobile-accordion">
          {columns.map((col) => (
            <details key={col.heading}>
              <summary>
                {col.heading}
                <span className="footer-chevron" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </summary>
              <ul className="footer-acc-links">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      />

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {year} Hamplard. All rights reserved.
        </p>
        <div className="footer-socials">
          {socials.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="footer-social-btn"
            >
              {s.icon}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
