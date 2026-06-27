export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading course">
      <div className="aspect-video bg-ink-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-ink-100 rounded w-1/3" />
        <div className="h-4 bg-ink-100 rounded w-3/4" />
        <div className="h-3 bg-ink-100 rounded w-1/2" />
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 bg-ink-100 rounded w-24" />
          <div className="h-3 bg-ink-100 rounded w-12" />
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-ink-50">
          <div className="h-5 bg-ink-100 rounded w-16" />
          <div className="h-3 bg-ink-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}
