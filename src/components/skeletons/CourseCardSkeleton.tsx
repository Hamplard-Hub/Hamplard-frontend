export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden" role="status" aria-label="Loading course">
      {/* Thumbnail */}
      <div className="aspect-video bg-hamplard-lilac animate-pulse" />

      <div className="p-4">
        {/* Category label */}
        <div className="h-3 w-16 rounded bg-hamplard-lilac animate-pulse mb-2" />

        {/* Title — two lines */}
        <div className="h-4 w-full rounded bg-hamplard-lilac animate-pulse mb-1.5" />
        <div className="h-4 w-3/4 rounded bg-hamplard-lilac animate-pulse mb-3" />

        {/* Instructor name */}
        <div className="h-3 w-28 rounded bg-hamplard-lilac animate-pulse mb-3" />

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-3 w-10 rounded bg-hamplard-lilac animate-pulse" />
          <div className="h-3 w-14 rounded bg-hamplard-lilac animate-pulse" />
          <div className="h-3 w-10 rounded bg-hamplard-lilac animate-pulse" />
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-100">
          <div className="h-5 w-20 rounded bg-hamplard-lilac animate-pulse" />
          <div className="h-5 w-16 rounded-lg bg-hamplard-lilac animate-pulse" />
        </div>
      </div>
    </div>
  );
}
