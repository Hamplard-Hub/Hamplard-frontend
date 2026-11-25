/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// Bundle Analyzer
// ---------------------------------------------------------------------------

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// ---------------------------------------------------------------------------
// Security-header helpers
// ---------------------------------------------------------------------------

/**
 * Baseline headers sent on every HTML response.
 *
 * Content-Security-Policy is intentionally in Report-Only mode so we can
 * observe violations without breaking anything while the policy is being
 * tightened. Switch the key to "Content-Security-Policy" once the reports
 * are clean.
 *
 * Sources included:
 *   - js.stripe.com / hooks.stripe.com  — Stripe.js + payment element iframes
 *   - *.stellar.org                     — Stellar / Soroban RPC calls
 *   - hamplard.com                      — production API & media origin
 *
 * 'unsafe-inline' for style-src is required by Tailwind CSS (inline styles
 * injected by the CSS-in-JS layer).  Remove once a nonce/hash strategy is
 * adopted.
 */
const CSP = [
  "default-src 'self'",
  // Scripts: self + Stripe.js (loaded by next/script or direct import)
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  // Styles: self + inline (Tailwind / CSS-in-JS)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + hamplard CDN
  "img-src 'self' data: https://hamplard.com",
  // Fonts: self
  "font-src 'self'",
  // XHR / fetch: self + API origin + Stellar RPC
  "connect-src 'self' https://hamplard.com https://*.stellar.org",
  // iFrames: Stripe payment element embeds its card fields in iframes
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  // Disallow embedding THIS site in foreign frames (clickjacking)
  "frame-ancestors 'none'",
  // No plugins
  "object-src 'none'",
  // Restrict base tag
  "base-uri 'self'",
  // Forms must submit to self
  "form-action 'self'",
  // Violations are reported to the Next.js API route (create when ready)
  // "report-uri /api/csp-report",
].join('; ');

/** Headers applied to every route. */
const baseHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow embedding in foreign frames (belt-and-suspenders alongside CSP)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Default referrer policy — sends origin only on cross-origin requests,
  // full URL on same-origin.  Overridden to no-referrer on sensitive routes.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser feature APIs
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
  },
  // Force HTTPS for 1 year once the site is on a TLS origin.
  // includeSubDomains is intentionally omitted until all subdomains are ready.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  // CSP in report-only mode — observe before enforcing
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

/**
 * Referrer-Policy override for routes that carry secrets in the URL
 * (reset-password tokens, gift-claim tokens).  Using no-referrer ensures
 * the full URL — including the token — is never forwarded to third-party
 * origins via the Referer header.
 */
const noReferrerHeader = { key: 'Referrer-Policy', value: 'no-referrer' };

// ---------------------------------------------------------------------------

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  images: {
    domains: ['localhost', 'hamplard.com'],
  },

  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/profile', destination: '/dashboard/profile', permanent: true },
      { source: '/instructor/courses/new', destination: '/dashboard/courses/create', permanent: true },
    ];
  },

  async headers() {
    return [
      // ── Baseline: all routes ────────────────────────────────────────────
      {
        source: '/:path*',
        headers: baseHeaders,
      },

      // ── Sensitive routes: no-referrer overrides the baseline ────────────
      // reset-password — token supplied as a query param (?token=…)
      {
        source: '/reset-password',
        headers: [noReferrerHeader],
      },
      // gift claim — token is part of the URL path
      {
        source: '/gift/claim/:token*',
        headers: [noReferrerHeader],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
