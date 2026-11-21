import { CourseCardSkeleton } from './CourseCardSkeleton';

// ── Section-level skeletons ──────────────────────────────────────

/** Skeleton for the QuickStats tile row (3 stat cards). */
export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3" role="status" aria-label="Loading stats">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-3 text-center">
          <div className="h-3 w-14 rounded bg-hamplard-lilac animate-pulse mx-auto mb-2" />
          <div className="h-6 w-10 rounded bg-hamplard-lilac animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the ContinueLearning list (2 items by default). */
export function ContinueLearningSkeletonList({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading continue learning">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-3 flex items-center gap-3">
          <div className="w-12 h-8 rounded-md bg-hamplard-lilac animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-hamplard-lilac animate-pulse" />
            <div className="h-2 w-full rounded-full bg-hamplard-lilac animate-pulse" />
          </div>
          <div className="h-3 w-8 rounded bg-hamplard-lilac animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a course grid (default 6 cards). */
export function CourseGridSkeleton({
  count = 6,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div
      className={`grid ${columns} gap-5`}
      role="status"
      aria-label="Loading courses"
    >
      {[...Array(count)].map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Full-page skeleton (sidebar + chrome + content) ──────────────

/**
 * DashboardSkeleton
 *
 * Full-page skeleton used while the entire dashboard shell is loading.
 * For per-section loading states, use the named section exports above:
 *   - QuickStatsSkeleton
 *   - ContinueLearningSkeletonList
 *   - CourseGridSkeleton
 */
export function DashboardSkeleton() {
  return (
    <div
      className="flex h-screen bg-ink-50 overflow-hidden"
      role="status"
      aria-label="Loading dashboard"
    >
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
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-7 w-48 rounded bg-hamplard-lilac animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-hamplard-lilac animate-pulse" />
            </div>

            {/* Stats bar */}
            <div className="mb-6">
              <QuickStatsSkeleton />
            </div>

            {/* Continue learning */}
            <div className="mb-6">
              <div className="h-5 w-36 rounded bg-hamplard-lilac animate-pulse mb-4" />
              <ContinueLearningSkeletonList count={2} />
            </div>

            {/* Course grid */}
            <div className="h-5 w-32 rounded bg-hamplard-lilac animate-pulse mb-4" />
            <CourseGridSkeleton count={6} />
          </div>
        </main>
      </div>
    </div>
  );
}
