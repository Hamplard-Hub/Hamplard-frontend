'use client';

import { BookOpen } from 'lucide-react';

// ── Category metadata ──────────────────────────────────────────────────────
export interface CategoryMeta {
  name: string;
  icon: string;
  description: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'tailoring': {
    name: 'Tailoring',
    icon: '🧵',
    description: 'Master sewing, pattern-making, and garment construction from beginner to professional level.',
  },
  'baking': {
    name: 'Baking',
    icon: '🍰',
    description: 'From bread to celebration cakes — learn professional baking and pastry techniques at your own pace.',
  },
  'photography': {
    name: 'Photography',
    icon: '📷',
    description: 'Capture stunning images and build a photography business with guidance from working professionals.',
  },
  'makeup-artistry': {
    name: 'Makeup Artistry',
    icon: '💄',
    description: 'Learn bridal, editorial, and special-effects makeup from top-rated artists across Africa.',
  },
  'hairstyling': {
    name: 'Hairstyling',
    icon: '💇',
    description: 'Cut, colour, and style — comprehensive hair courses for salon professionals and home enthusiasts.',
  },
  'nail-technology': {
    name: 'Nail Technology',
    icon: '💅',
    description: 'Nail art, gel extensions, and nail care business skills — everything you need to build a clientele.',
  },
  'catering': {
    name: 'Catering',
    icon: '🍽️',
    description: 'Plan and execute memorable events with great food — from menu design to large-scale service.',
  },
  'fashion-design': {
    name: 'Fashion Design',
    icon: '👗',
    description: 'Design, sketch, and produce garments — from concept to finished collection.',
  },
  'web-development': {
    name: 'Web Development',
    icon: '💻',
    description: 'Build modern websites and web apps from scratch with industry-standard tools and frameworks.',
  },
  'business': {
    name: 'Business',
    icon: '💼',
    description: 'Grow your entrepreneurial skills with courses on finance, marketing, management, and strategy.',
  },
  'culinary-arts': {
    name: 'Culinary Arts',
    icon: '👨‍🍳',
    description: 'Master cooking techniques, food styling, and kitchen management from expert chefs.',
  },
};

/** Fallback meta for slugs not in the map above */
export function getCategoryMeta(slug: string): CategoryMeta {
  if (CATEGORY_META[slug]) return CATEGORY_META[slug];
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    name,
    icon: '🎓',
    description: `Explore ${name} courses taught by expert instructors.`,
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
      className="bg-[#26215C] border-b border-white/10"
      aria-labelledby="category-hero-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Icon bubble */}
          <div
            className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl sm:text-5xl select-none"
            aria-hidden="true"
          >
            {meta.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">
              Category
            </p>
            <h1
              id="category-hero-heading"
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
            >
              {meta.name}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
              {meta.description}
            </p>

            {/* Course count badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <BookOpen className="w-3.5 h-3.5 text-saffron-300" aria-hidden="true" />
              <span className="text-xs font-semibold text-white">
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
