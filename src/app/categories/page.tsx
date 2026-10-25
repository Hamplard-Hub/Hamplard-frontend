'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { getCategoryMeta } from '@/components/category/CategoryHero';
import type { Category } from '@/types';

const GROUPS = [
  {
    title: 'Fashion',
    slugs: ['tailoring', 'fashion-design'],
  },
  {
    title: 'Beauty',
    slugs: ['makeup-artistry', 'hairstyling', 'nail-technology'],
  },
  {
    title: 'Food',
    slugs: ['baking', 'culinary-arts'],
  },
  {
    title: 'Media',
    slugs: ['photography'],
  },
  {
    title: 'Trades',
    slugs: ['web-development'],
  },
];

function slugFromName(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export default function CategoriesIndexPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await coursesApi.getCategories();
        setCategories(cats);

        // Fetch course counts for each category
        const countMap: Record<string, number> = {};
        await Promise.all(
          cats.map(async (cat) => {
            try {
              const res = await coursesApi.list({ category: cat.name, limit: 1 });
              countMap[cat.name] = res.total || 0;
            } catch {
              countMap[cat.name] = 0;
            }
          }),
        );
        setCounts(countMap);
      } catch (error) {
        console.error('Failed to load categories', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryBySlug = (slug: string) => {
    return categories.find((cat) => slugFromName(cat.name) === slug);
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#EEEDFE] to-white border-b border-[#E0DEFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#26215C] mb-4">
            Browse Categories
          </h1>
          <p className="text-lg text-[#554F99] max-w-2xl">
            Discover practical skills across fashion, beauty, food, media, and trades taught by expert
            instructors.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-[#F6F5FF] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {GROUPS.map((group) => {
              const groupCategories = group.slugs
                .map((slug) => getCategoryBySlug(slug))
                .filter(Boolean) as Category[];

              if (groupCategories.length === 0) return null;

              return (
                <section key={group.title}>
                  <h2 className="text-2xl font-bold text-[#26215C] mb-6">{group.title}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupCategories.map((category) => {
                      const slug = slugFromName(category.name);
                      const meta = getCategoryMeta(slug);
                      const count = counts[category.name] || 0;

                      return (
                        <Link
                          key={category.id}
                          href={`/categories/${slug}`}
                          className="group flex items-center gap-4 p-6 bg-white border border-[#E0DEFA] rounded-2xl hover:border-[#7F77DD] hover:shadow-lg hover:shadow-[#7F77DD]/5 transition-all duration-200"
                        >
                          <div
                            className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl`}
                          >
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#26215C] group-hover:text-[#3C3489] transition-colors">
                              {category.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#6B66A6]">
                              <BookOpen className="w-4 h-4" />
                              <span>
                                {count} {count === 1 ? 'course' : 'courses'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
