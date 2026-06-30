import { CourseCardSkeleton } from './CourseCardSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden" role="status" aria-label="Loading dashboard">
      {/* Sidebar skeleton */}
      <aside className="w-60 bg-white border-r border-ink-100 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-ink-100">
          <div className="h-6 w-28 rounded bg-hamplard-lilac animate-pulse" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-4 h-4 rounded bg-hamplard-lilac animate-pulse" />
              <div className="h-4 w-24 rounded bg-hamplard-lilac animate-pulse" />
            </div>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-ink-50">
            <div className="w-7 h-7 rounded-full bg-hamplard-lilac animate-pulse flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 rounded bg-hamplard-lilac animate-pulse" />
              <div className="h-2.5 w-14 rounded bg-hamplard-lilac animate-pulse" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar skeleton */}
        <div className="h-16 border-b border-ink-100 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="h-5 w-32 rounded bg-hamplard-lilac animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-hamplard-lilac animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-hamplard-lilac animate-pulse" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-7 w-48 rounded bg-hamplard-lilac animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-hamplard-lilac animate-pulse" />
            </div>

            {/* Stats bar skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-hamplard-lilac animate-pulse flex-shrink-0" />
                    <div className="h-3 w-14 rounded bg-hamplard-lilac animate-pulse" />
                  </div>
                  <div className="h-7 w-16 rounded bg-hamplard-lilac animate-pulse mt-2" />
                </div>
              ))}
            </div>

            {/* Section heading skeleton */}
            <div className="h-5 w-32 rounded bg-hamplard-lilac animate-pulse mb-4" />

            {/* Card grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
