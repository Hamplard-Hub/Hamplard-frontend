"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Users, BookOpen, Award } from "lucide-react";

const CATEGORIES = ["Tailoring", "Makeup Artistry", "Baking", "Hairstyling", "Photography", "Nail Technology", "Fashion Design", "Eyelash Extension"];

const TRUST_STATS = [
  { icon: <Users size={13} aria-hidden />, stat: "10,000+", label: "students" },
  { icon: <BookOpen size={13} aria-hidden />, stat: "500+", label: "courses" },
  { icon: <Award size={13} aria-hidden />, stat: "200+", label: "instructors" },
];

export function HeroSection() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = () => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative overflow-hidden w-full" style={{ background: "linear-gradient(135deg, #26215C 0%, #3C3489 100%)" }} aria-label="Hero">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] w-[360px] h-[360px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(238,237,254,0.07) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-32 left-[50%] w-[360px] h-[360px] rounded-full"
        style={{ background: "radial-gradient(circle, #26215C 0%, transparent 70%)" }}
      />

      <div className="hero-grid relative mx-auto max-w-[1280px] px-6 xl:py-16 md:py-10 py-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center xl:px-10">
        {/* ── Left column ── */}
        <div className="hero-fade-up flex flex-col items-start" style={{ animation: "heroFadeUp 0.55s ease both" }}>
          {/* Overline badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 w-fit">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 md:text-sm text-xs font-medium tracking-wide">Africa&apos;s #1 practical skills platform</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold md:mt-6 mt-4 text-white max-w-[32rem] leading-[1.08] tracking-[-0.03em] text-[clamp(2.4rem,5vw,3.5rem)]">
            Learn tailoring, makeup, baking <span className="text-orange-400">and more</span> — from home.
          </h1>

          {/* Sub-headline */}
          <p className="xl:text-lg md:text-base text-sm leading-relaxed text-[#EEEDFE]/80 md:my-6 my-4 max-w-[32rem]">
            Structured, step-by-step courses taught by verified African professionals. Go from complete beginner to job-ready at your own pace.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-[34rem] md:mb-8 mb-6">
            <label htmlFor="hero-search" className="sr-only">
              What do you want to learn?
            </label>
            <div
              className="flex items-center gap-2 bg-white shadow-lg transition-shadow duration-200 pl-5 pr-1.5 py-1.5"
              style={{ borderRadius: "var(--radius-pill)" }}
              onFocusCapture={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(38,33,92,0.4), 0 0 0 3px rgba(127,119,221,0.4)";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: "#7F77DD" }} aria-hidden="true" />
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you want to learn?"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm placeholder:text-[#6B66A6]"
                style={{ color: "#26215C" }}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="shrink-0 text-white font-bold text-sm px-5 py-2.5 transition-all duration-150 active:scale-[0.98] hover:opacity-90"
                style={{ backgroundColor: "#7F77DD", borderRadius: "var(--radius-pill)" }}
              >
                Search
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="w-full flex max-sm:flex-col sm:flex-row sm:gap-3 gap-2 mb-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-1.5 text-white font-bold text-sm md:px-7 px-4 py-3 bg-hamplard-primary hover:bg-hamplard-primary/80 transition-all duration-150 active:scale-[0.98] rounded-full"
            >
              Get started free
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center justify-center font-semibold text-sm text-white md:px-7 px-4 py-3 border border-[#EEEDFE]/35 hover:bg-[#EEEDFE]/10 hover:border-[#EEEDFE]/65 transition-all duration-150"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              Browse courses
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center md:gap-6 gap-4 pb-2">
            {TRUST_STATS.map(({ icon, stat, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[#EEEDFE]/50 flex">{icon}</span>
                <span className="text-sm font-extrabold text-white">{stat}</span>
                <span className="text-[0.82rem] text-[#EEEDFE]/60">{label}</span>
              </div>
            ))}
            <span className="text-[#EEEDFE]/20 hidden sm:inline">·</span>
            <span className="text-[0.72rem] text-[#EEEDFE]/40">🔒 Payments secured on Stellar blockchain</span>
          </div>
        </div>

        {/* ── Right column: SVG illustration ── */}
        <div className="hero-right hidden lg:flex justify-center items-center relative min-h-[420px]" style={{ animation: "heroFadeUp 0.7s 0.15s ease both" }}>
          <svg
            viewBox="0 0 480 440"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[520px] relative z-10"
            aria-label="Illustration of a student learning online"
            role="img"
          >
            <defs>
              <linearGradient id="videoGrad" x1="88" y1="108" x2="332" y2="210" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3C3489" />
                <stop offset="100%" stopColor="#7F77DD" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7F77DD" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#26215C" stopOpacity="0" />
              </linearGradient>
              <filter id="cardShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(38,33,92,0.3)" />
              </filter>
              <filter id="laptopGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="rgba(127,119,221,0.35)" />
              </filter>
            </defs>
            <ellipse cx="240" cy="230" rx="190" ry="165" fill="rgba(127,119,221,0.1)" />
            <ellipse cx="240" cy="230" rx="140" ry="120" fill="rgba(127,119,221,0.08)" />
            <ellipse cx="240" cy="365" rx="130" ry="12" fill="rgba(38,33,92,0.35)" />
            <rect x="100" y="295" width="280" height="18" rx="5" fill="#2D2870" />
            <rect x="82" y="311" width="316" height="10" rx="5" fill="#1E1A50" />
            <rect x="108" y="100" width="264" height="198" rx="14" fill="#1E1A50" filter="url(#laptopGlow)" />
            <rect x="116" y="108" width="248" height="182" rx="9" fill="#0F0D2E" />
            <rect x="116" y="108" width="248" height="182" rx="9" fill="#14113B" />
            <rect x="116" y="108" width="248" height="120" rx="9" fill="url(#videoGrad)" />
            <rect x="116" y="108" width="248" height="120" rx="9" fill="url(#screenGlow)" opacity="0.4" />
            <circle cx="200" cy="140" r="22" fill="rgba(238,237,254,0.08)" />
            <circle cx="200" cy="133" r="11" fill="rgba(238,237,254,0.2)" />
            <ellipse cx="200" cy="158" rx="17" ry="10" fill="rgba(238,237,254,0.12)" />
            <circle cx="295" cy="145" r="26" fill="rgba(255,255,255,0.12)" />
            <circle cx="295" cy="145" r="19" fill="rgba(255,255,255,0.95)" />
            <polygon points="291,137 291,153 306,145" fill="#3C3489" />
            <rect x="126" y="218" width="90" height="5" rx="2.5" fill="rgba(238,237,254,0.7)" />
            <rect x="126" y="228" width="65" height="4" rx="2" fill="rgba(238,237,254,0.35)" />
            <rect x="126" y="246" width="200" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />
            <rect x="126" y="246" width="148" height="5" rx="2.5" fill="#7F77DD" />
            <circle cx="274" cy="248.5" r="7" fill="#7F77DD" stroke="white" strokeWidth="2" />
            <text x="334" y="252" fontSize="9" fill="rgba(238,237,254,0.45)" fontFamily="DM Sans, sans-serif">
              12:40
            </text>
            <rect x="126" y="262" width="14" height="14" rx="3" fill="rgba(127,119,221,0.5)" />
            <rect x="146" y="264" width="72" height="4" rx="2" fill="rgba(238,237,254,0.55)" />
            <rect x="146" y="272" width="50" height="3" rx="2" fill="rgba(238,237,254,0.25)" />
            <rect x="126" y="281" width="14" height="14" rx="3" fill="rgba(238,237,254,0.12)" />
            <rect x="146" y="283" width="60" height="4" rx="2" fill="rgba(238,237,254,0.3)" />
            <rect x="146" y="291" width="40" height="3" rx="2" fill="rgba(238,237,254,0.15)" />
            <circle cx="133" cy="289" r="7" fill="#22c55e" opacity="0.8" />
            <polyline points="130,289 132,291 137,286" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <g style={{ animation: "floatBadge1 3.5s ease-in-out infinite" }}>
              <rect x="10" y="148" width="146" height="68" rx="14" fill="white" filter="url(#cardShadow)" />
              <rect x="10" y="148" width="5" height="68" rx="3" fill="#7F77DD" />
              <rect x="24" y="160" width="36" height="36" rx="8" fill="#EEEDFE" />
              <text x="42" y="183" textAnchor="middle" fontSize="18" fill="#26215C">
                ✂️
              </text>
              <text x="66" y="170" fontSize="11" fontWeight="700" fill="#26215C" fontFamily="DM Sans, sans-serif">
                Tailoring 101
              </text>
              <text x="66" y="184" fontSize="9" fill="#7F77DD" fontFamily="DM Sans, sans-serif" fontWeight="600">
                4.9 ★
              </text>
              <text x="90" y="184" fontSize="9" fill="#9990CC" fontFamily="DM Sans, sans-serif">
                1,240 students
              </text>
              <rect x="66" y="192" width="68" height="14" rx="4" fill="#EEEDFE" />
              <text x="104" y="202" textAnchor="middle" fontSize="9" fill="#26215C" fontFamily="DM Sans, sans-serif" fontWeight="600">
                BEGINNER
              </text>
            </g>
            <g style={{ animation: "floatBadge2 4s 0.5s ease-in-out infinite" }}>
              <rect x="340" y="108" width="140" height="64" rx="14" fill="white" filter="url(#cardShadow)" />
              <rect x="340" y="108" width="5" height="64" rx="3" fill="#f59e0b" />
              <rect x="354" y="118" width="34" height="34" rx="8" fill="#fef3c7" />
              <text x="371" y="140" textAnchor="middle" fontSize="17" fill="#92400e">
                🏆
              </text>
              <text x="394" y="128" fontSize="11" fontWeight="700" fill="#26215C" fontFamily="DM Sans, sans-serif">
                Certificate
              </text>
              <text x="394" y="141" fontSize="10" fill="#9990CC" fontFamily="DM Sans, sans-serif">
                Verified on
              </text>
              <text x="394" y="152" fontSize="9" fill="#7F77DD" fontFamily="DM Sans, sans-serif" fontWeight="600">
                Stellar blockchain
              </text>
            </g>
            <g style={{ animation: "floatBadge3 3.2s 1s ease-in-out infinite" }}>
              <rect x="336" y="285" width="138" height="68" rx="14" fill="white" filter="url(#cardShadow)" />
              <rect x="336" y="285" width="5" height="68" rx="3" fill="#22c55e" />
              {["#7F77DD", "#9F8FE8", "#B8AEFF", "#EEEDFE"].map((c, i) => (
                <circle key={i} cx={362 + i * 14} cy="308" r="11" fill={c} stroke="white" strokeWidth="2.5" />
              ))}
              <text x="352" y="330" fontSize="11" fontWeight="700" fill="#26215C" fontFamily="DM Sans, sans-serif">
                10,000+ students
              </text>
              <text x="352" y="341" fontSize="9" fill="#22c55e" fontFamily="DM Sans, sans-serif" fontWeight="600">
                ● Learning right now
              </text>
            </g>
            {[
              [60, 90],
              [430, 180],
              [48, 370],
              [440, 380],
              [90, 390],
              [420, 110],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 4 : 2.5} fill="rgba(238,237,254,0.18)" />
            ))}
            <g fill="rgba(238,237,254,0.35)">
              <polygon points="70,68 73,76 76,68 73,60" />
              <polygon points="420,200 422,206 424,200 422,194" />
            </g>
          </svg>
        </div>
      </div>

      {/* ── Category pills marquee ── */}
      <div className="mx-auto max-w-[1200px] md:py-12 py-8 overflow-hidden">
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 z-10" style={{ background: "linear-gradient(to right, #2D2870, transparent)" }} />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 z-10" style={{ background: "linear-gradient(to left, #372F7E, transparent)" }} />
          <div className="marquee-track flex gap-3 w-max">
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <button
                key={`${cat}-${i}`}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className="shrink-0 px-4 py-2 text-[0.8rem] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: activeCategory === cat ? "#ffffff" : "rgba(238,237,254,0.15)",
                  color: activeCategory === cat ? "#26215C" : "#EEEDFE",
                  transform: activeCategory === cat ? "scale(1.05)" : "scale(1)",
                  border: "1px solid rgba(238,237,254,0.2)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
