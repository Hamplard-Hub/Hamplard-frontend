export function CourseDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto" role="status" aria-label="Loading course details">
      {/* Banner skeleton */}
      <div className="aspect-[21/9] w-full rounded-2xl bg-hamplard-lilac animate-pulse mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content column — curriculum */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <div className="h-3 w-20 rounded bg-hamplard-lilac animate-pulse mb-2" />
            <div className="h-8 w-3/4 rounded bg-hamplard-lilac animate-pulse mb-2" />
            <div className="h-4 w-1/2 rounded bg-hamplard-lilac animate-pulse" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-hamplard-lilac animate-pulse" />
            <div className="h-3 w-full rounded bg-hamplard-lilac animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-hamplard-lilac animate-pulse" />
          </div>

          {/* Curriculum heading */}
          <div className="h-5 w-32 rounded bg-hamplard-lilac animate-pulse" />

          {/* Curriculum modules */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-40 rounded bg-hamplard-lilac animate-pulse" />
                  <div className="h-3 w-16 rounded bg-hamplard-lilac animate-pulse" />
                </div>
                <div className="space-y-2 pl-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-hamplard-lilac animate-pulse flex-shrink-0" />
                      <div className="h-3 w-3/4 rounded bg-hamplard-lilac animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-6">
            {/* Price */}
            <div className="h-8 w-24 rounded bg-hamplard-lilac animate-pulse mb-4" />

            {/* CTA button */}
            <div className="h-11 w-full rounded-xl bg-hamplard-lilac animate-pulse mb-4" />

            {/* Meta rows */}
            <div className="space-y-3 pt-4 border-t border-ink-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-hamplard-lilac animate-pulse" />
                  <div className="h-3 w-12 rounded bg-hamplard-lilac animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructor card */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-hamplard-lilac animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-hamplard-lilac animate-pulse" />
                <div className="h-3 w-16 rounded bg-hamplard-lilac animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
