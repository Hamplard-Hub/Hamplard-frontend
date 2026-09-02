'use client';

import { BookOpen } from 'lucide-react';

// ── Category metadata ──────────────────────────────────────────────────────
// Maps category slugs to display name, emoji icon, gradient colours, and
// a short description used as the hero sub-heading.
export interface CategoryMeta {
  name: string;
  icon: string;
  description: string;
  gradient: string; // Tailwind bg-gradient-to-br class pair
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'tailoring': {
    name: 'Tailoring',
    icon: '🧵',
    description: 'Master the art of sewing, pattern-making, and garment construction from beginner to professional level.',
    gradient: 'from-purple-100 to-pink-100',
  },
  'baking': {
    name: 'Baking',
    icon: '🍰',
    description: 'From bread to celebration cakes — learn professional baking and pastry techniques at your own pace.',
    gradient: 'from-amber-100 to-orange-100',
  },
  'photography': {
    name: 'Photography',
    icon: '📷',
    description: 'Capture stunning images and build a photography business with guidance from working professionals.',
    gradient: 'from-sky-100 to-blue-100',
  },
  'makeup-artistry': {
    name: 'Makeup Artistry',
    icon: '💄',
    description: 'Learn bridal, editorial, and special-effects makeup from top-rated artists across Africa.',
    gradient: 'from-rose-100 to-pink-100',
  },
  'hairstyling': {
    name: 'Hairstyling',
    icon: '💇',
    description: 'Cut, colour, and style — comprehensive hair courses for salon professionals and home enthusiasts.',
    gradient: 'from-teal-100 to-emerald-100',
  },
  'nail-technology': {
    name: 'Nail Technology',
    icon: '💅',
    description: 'Nail art, gel extensions, and nail care business skills — everything you need to build a clientele.',
    gradient: 'from-fuchsia-100 to-purple-100',
  },
  'web-development': {
    name: 'Web Development',
    icon: '💻',
    description: 'Build modern websites and web apps from scratch with industry-standard tools and frameworks.',
    gradient: 'from-cyan-100 to-blue-100',
  },
  'business': {
    name: 'Business',
    icon: '💼',
    description: 'Grow your entrepreneurial skills with courses on finance, marketing, management, and strategy.',
    gradient: 'from-yellow-100 to-amber-100',
  },
  'culinary-arts': {
    name: 'Culinary Arts',
    icon: '👨‍🍳',
    description: 'Master cooking techniques, food styling, and kitchen management from expert chefs.',
    gradient: 'from-red-100 to-orange-100',
  },
  'fashion-design': {
    name: 'Fashion Design',
    icon: '👗',
    description: 'Design, sketch, and produce garments — from concept to finished collection.',
    gradient: 'from-violet-100 to-purple-100',
  },
};

/** Fallback meta for slugs not in the map above */
export function getCategoryMeta(slug: string): CategoryMeta {
  if (CATEGORY_META[slug]) return CATEGORY_META[slug];
  // Try matching by converting slug to title-case
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    name,
    icon: '🎓',
    description: `Explore ${name} courses taught by expert instructors.`,
    gradient: 'from-hamplard-lilac to-saffron-100',
  };
}

// ── Component ──────────────────────────────────────────────────────────────

interface CategoryHeroProps {
  slug: string;
  courseCount: number;
}

export function CategoryHero({ slug, courseCount }: CategoryHeroProps) {
  const meta = getCategoryMeta(slug);

  return (
    <section
      className={`bg-gradient-to-br ${meta.gradient} border-b border-ink-100`}
      aria-labelledby="category-hero-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Icon bubble */}
          <div
            className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center text-4xl sm:text-5xl select-none"
            aria-hidden="true"
          >
            {meta.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-1">
              Category
            </p>
            <h1
              id="category-hero-heading"
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-900 leading-tight"
            >
              {meta.name}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-ink-600 max-w-2xl leading-relaxed">
              {meta.description}
            </p>

            {/* Course count badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white/80 rounded-full px-4 py-1.5 shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-hamplard-primary" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink-700">
                {courseCount.toLocaleString()}{' '}
                {courseCount === 1 ? 'course' : 'courses'} available
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CategoryHero;
