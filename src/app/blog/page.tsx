import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Hamplard',
  description: 'Articles, guides and inspiration for learners and creative entrepreneurs.',
  openGraph: {
    title: 'Blog | Hamplard',
    description: 'Articles, guides and inspiration for learners and creative entrepreneurs.',
    type: 'website',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readingTime: number;
  featured?: boolean;
}

const POSTS: BlogPost[] = [
  {
    slug: 'how-to-price-your-cakes',
    title: 'How to Price Your Cakes for Profit',
    excerpt: 'Learn the exact formula professional bakers use to price their cakes so you never undersell your work again.',
    category: 'Business',
    author: 'Adaeze Okafor',
    date: '2024-12-10',
    readingTime: 6,
    featured: true,
  },
  {
    slug: 'starting-a-tailoring-business',
    title: 'Starting a Tailoring Business from Scratch',
    excerpt: 'From your first sewing machine to your first paying client — a step-by-step guide for aspiring tailors.',
    category: 'Entrepreneurship',
    author: 'Chukwuemeka Eze',
    date: '2024-11-28',
    readingTime: 8,
  },
  {
    slug: 'social-media-for-artisans',
    title: 'Social Media Marketing for Artisans',
    excerpt: 'How to use Instagram and TikTok to grow your craft business without spending on ads.',
    category: 'Marketing',
    author: 'Ngozi Bello',
    date: '2024-11-15',
    readingTime: 5,
  },
  {
    slug: 'pattern-making-basics',
    title: 'Pattern Making Basics Every Tailor Should Know',
    excerpt: 'Master the fundamental techniques that separate amateur tailors from professionals.',
    category: 'Skills',
    author: 'Chukwuemeka Eze',
    date: '2024-10-30',
    readingTime: 7,
  },
];

const CATEGORIES = ['All', 'Business', 'Entrepreneurship', 'Marketing', 'Skills'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const activeCategory = searchParams.category ?? 'All';
  const page = Number(searchParams.page ?? 1);
  const perPage = 6;

  const filtered = activeCategory === 'All'
    ? POSTS
    : POSTS.filter((p) => p.category === activeCategory);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);
  const paginated = rest.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(rest.length / perPage);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Blog</h1>
      <p className="text-ink-500 mb-8">Articles, guides and inspiration for creative entrepreneurs.</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/blog?category=${cat}`}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-saffron-500 text-white border-saffron-500'
                : 'bg-white text-ink-600 border-ink-200 hover:border-saffron-400'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Featured post */}
      {featured && page === 1 && (
        <Link href={`/blog/${featured.slug}`} className="block mb-10 card overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-8">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-saffron-100 text-saffron-700 mb-3">
              Featured · {featured.category}
            </span>
            <h2 className="text-2xl font-bold text-ink-900 mb-2">{featured.title}</h2>
            <p className="text-ink-500 mb-4">{featured.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <span>{featured.author}</span>
              <span>·</span>
              <span>{formatDate(featured.date)}</span>
              <span>·</span>
              <span>{featured.readingTime} min read</span>
            </div>
          </div>
        </Link>
      )}

      {/* Post grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {paginated.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="card p-5 hover:shadow-md transition-shadow flex flex-col">
            <span className="text-xs font-medium text-saffron-600 mb-2">{post.category}</span>
            <h3 className="font-semibold text-ink-900 mb-2 flex-1">{post.title}</h3>
            <p className="text-xs text-ink-500 line-clamp-2 mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <span>{post.author}</span>
              <span>·</span>
              <span>{post.readingTime} min</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/blog?category=${activeCategory}&page=${page - 1}`} className="btn-secondary">
              Previous
            </Link>
          )}
          <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/blog?category=${activeCategory}&page=${page + 1}`} className="btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
