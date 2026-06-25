import Link from 'next/link';
import { CourseBrowser } from '@/components/courses/CourseBrowser';
import { TopBar } from '@/components/layout/TopBar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <TopBar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12">
        <div className="max-w-2xl">
          <p className="text-saffron-600 font-medium text-sm mb-3 tracking-wide uppercase">
            Practical skills. Real results.
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900 leading-tight mb-5">
            Learn tailoring, makeup,{' '}
            <span className="text-saffron-600">baking</span>{' '}
            and more — from home.
          </h1>
          <p className="text-ink-500 text-lg leading-relaxed mb-8">
            Structured, step-by-step courses taught by verified professionals.
            Go from beginner to job-ready at your own pace.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/auth/login" className="btn-primary text-base px-6 py-3">
              Browse courses
            </Link>
            <Link href="/auth/login?role=INSTRUCTOR" className="btn-secondary text-base px-6 py-3">
              Become an instructor
            </Link>
          </div>
          <p className="text-xs text-ink-400 mt-4">
            Payments secured on the Stellar blockchain. Certificates verifiable by anyone.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <section className="max-w-6xl mx-auto px-5 mb-8">
        <div className="flex gap-2 flex-wrap">
          {['Tailoring', 'Makeup Artistry', 'Baking', 'Hairstyling', 'Photography',
            'Nail Technology', 'Fashion Design', 'Eyelash Extension'].map((cat) => (
            <span key={cat}
              className="px-3 py-1.5 rounded-full border border-ink-200 bg-white text-xs font-medium text-ink-600 cursor-pointer hover:border-saffron-400 hover:text-saffron-700 transition-colors">
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Course grid */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="section-heading mb-6">Featured courses</h2>
        <CourseBrowser />
      </section>
    </div>
  );
}
