'use client';

import { useRouter } from 'next/navigation';

interface CategorySortSelectProps {
  slug: string;
  activeSub: string;
  activeSort: string;
}

export function CategorySortSelect({ slug, activeSub, activeSort }: CategorySortSelectProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (activeSub) params.set('sub', activeSub);
    params.set('sort', e.target.value);
    router.push(`/categories/${slug}?${params.toString()}`);
  }

  return (
    <div className="flex-shrink-0">
      <label htmlFor="cat-sort" className="sr-only">Sort by</label>
      <select
        id="cat-sort"
        value={activeSort}
        onChange={handleChange}
        className="select text-sm w-auto"
        aria-label="Sort courses"
      >
        <option value="popular">Most Popular</option>
        <option value="rated">Highest Rated</option>
        <option value="newest">Newest</option>
      </select>
    </div>
  );
}
