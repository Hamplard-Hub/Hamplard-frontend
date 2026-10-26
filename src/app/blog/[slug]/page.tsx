import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorBio: string;
  date: string;
  readingTime: number;
  body: string;
  relatedCourses: Array<{ id: string; title: string }>;
}

const POSTS: Record<string, BlogPost> = {
  'how-to-price-your-cakes': {
    slug: 'how-to-price-your-cakes',
    title: 'How to Price Your Cakes for Profit',
    excerpt: 'Learn the exact formula professional bakers use to price their cakes so you never undersell your work again.',
    category: 'Business',
    author: 'Adaeze Okafor',
    authorBio: 'Professional baker and business coach with 10+ years of experience.',
    date: '2024-12-10',
    readingTime: 6,
    body: `Pricing your cakes can feel overwhelming, but it doesn't have to be. The key is to account for all your costs and add a reasonable profit margin.

**Step 1: Calculate your ingredient costs**

List every ingredient in the recipe and calculate the exact cost per cake. Don't forget packaging materials.

**Step 2: Add your time**

Your time has value. Calculate how many hours a cake takes and multiply by your hourly rate.

**Step 3: Add overhead**

Include electricity, equipment wear, and any delivery costs.

**Step 4: Add your profit margin**

Add at least 20–30% on top of your total cost as profit.

By following this formula consistently, you'll never undersell your work again.`,
    relatedCourses: [
      { id: 'course_001', title: 'Cake Pricing Mastery' },
      { id: 'course_002', title: 'Business Basics for Artisans' },
    ],
  },
  'starting-a-tailoring-business': {
    slug: 'starting-a-tailoring-business',
    title: 'Starting a Tailoring Business from Scratch',
    excerpt: 'From your first sewing machine to your first paying client — a step-by-step guide for aspiring tailors.',
    category: 'Entrepreneurship',
    author: 'Chukwuemeka Eze',
    authorBio: 'Master tailor and entrepreneur with studios in Lagos and Abuja.',
    date: '2024-11-28',
    readingTime: 8,
    body: `Starting a tailoring business is more achievable than you think. Here's how to get started.

**Equipment you need to start**

You don't need everything at once. Start with a reliable sewing machine, measuring tape, scissors, and basic tools.

**Finding your first clients**

Start with friends and family, then ask for referrals. Social media is your best friend — post your work consistently.

**Pricing your services**

Research local market rates, but don't undercharge just to get clients. Your time and skill have real value.

**Growing your business**

Once you have steady clients, think about hiring assistants and expanding your service offering.`,
    relatedCourses: [
      { id: 'course_003', title: 'Introduction to Tailoring' },
      { id: 'course_004', title: 'Advanced Pattern Making' },
    ],
  },
};

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = POSTS[params.slug];
  if (!post) return { title: 'Article not found' };

  const ogUrl = `/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author)}`;

  return {
    title: `${post.title} | Hamplard Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ArticleJsonLd({ post }: { post: BlogPost }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'Hamplard',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function BlogArticlePage({ params }: PageProps) {
  const post = POSTS[params.slug];
  if (!post) notFound();

  return (
    <>
      <ArticleJsonLd post={post} />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-saffron-100 text-saffron-700 mb-4">
          {post.category}
        </span>

        <h1 className="text-3xl font-bold text-ink-900 mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-400 mb-8 pb-8 border-b border-ink-100">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.readingTime} min read
          </span>
        </div>

        <article className="prose prose-sm max-w-none text-ink-700 leading-relaxed space-y-4 mb-12">
          {post.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-ink-700">
              {para.startsWith('**') ? (
                <strong>{para.replace(/\*\*/g, '')}</strong>
              ) : (
                para
              )}
            </p>
          ))}
        </article>

        {/* Author bio */}
        <div className="card p-5 mb-10">
          <p className="text-xs text-ink-400 mb-1">About the author</p>
          <p className="font-semibold text-ink-900">{post.author}</p>
          <p className="text-sm text-ink-500 mt-1">{post.authorBio}</p>
        </div>

        {/* Related courses */}
        {post.relatedCourses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-ink-900 mb-4">Related Courses</h2>
            <div className="space-y-3">
              {post.relatedCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <span className="font-medium text-ink-800">{course.title}</span>
                  <span className="text-xs text-saffron-600 font-medium">View course →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
