'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { coursesApi } from '@/lib/api/services';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { useToast } from '@/lib/hooks/use-toast';
import { useWishlistHydrated, useWishlistStore } from '@/lib/hooks/use-wishlist-store';
import type { Course } from '@/types';

type BulkAction = 'move' | 'clear';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function WishlistPage() {
  const courseIds      = useWishlistStore((state) => state.courseIds);
  const removeFromList = useWishlistStore((state) => state.remove);
  const clearWishlist  = useWishlistStore((state) => state.clear);
  const addToCart      = useCartStore((state) => state.addItems);
  const hydrated       = useWishlistHydrated();
  const toast          = useToast();

  const [bulkAction, setBulkAction]     = useState<BulkAction | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  // Ids we have already tried to fetch, so a course that 404s is not re-requested
  // on every render.
  const requested = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hydrated) return;

    const missing = courseIds.filter((id) => !requested.current.has(id));
    if (missing.length === 0) { setLoading(false); return; }
    missing.forEach((id) => requested.current.add(id));

    let cancelled = false;
    setLoading(true);

    Promise.all(
      missing.map((id) =>
        coursesApi.get(id)
          .then((course) => [id, course] as const)
          .catch(() => null),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        setCourses((prev) => {
          const next = { ...prev };
          results.forEach((entry) => { if (entry) next[entry[0]] = entry[1]; });
          return next;
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [hydrated, courseIds]);

  // Driven by the store's order so un-hearting a card removes it immediately.
  const saved        = courseIds.map((id) => courses[id]).filter(Boolean) as Course[];
  const unavailable  = hydrated && !loading ? courseIds.length - saved.length : 0;
  const bulkDisabled = !hydrated || loading || bulkAction !== null;

  const handleMoveAllToCart = async () => {
    setBulkAction('move');
    try {
      // Give courses that failed to load earlier one more try, so a flaky
      // request does not silently leave them behind.
      const ids = [...courseIds];
      const retried = await Promise.all(
        ids
          .filter((id) => !courses[id])
          .map((id) => coursesApi.get(id).then((course) => [id, course] as const).catch(() => null)),
      );
      const found: Record<string, Course> = { ...courses };
      retried.forEach((entry) => { if (entry) found[entry[0]] = entry[1]; });
      if (retried.some(Boolean)) setCourses(found);

      const movable = ids.map((id) => found[id]).filter(Boolean) as Course[];
      if (movable.length === 0) {
        toast.error({
          title: 'Nothing was moved',
          description: 'We could not load your saved courses right now. Please try again.',
        });
        return;
      }

      const added = addToCart(movable);
      movable.forEach((course) => removeFromList(course.id));

      const details: string[] = [];
      const alreadyInCart = movable.length - added;
      if (alreadyInCart > 0) details.push(`${plural(alreadyInCart, 'course')} already in your cart.`);
      const leftBehind = ids.length - movable.length;
      if (leftBehind > 0) {
        details.push(`${plural(leftBehind, 'course')} could not be loaded and stayed in your wishlist.`);
      }

      toast.success({
        title: `Moved ${plural(movable.length, 'course')} to your cart`,
        description: details.join(' ') || undefined,
      });
    } finally {
      setBulkAction(null);
    }
  };

  const handleClearWishlist = () => {
    setBulkAction('clear');
    try {
      const count = courseIds.length;
      clearWishlist();
      setConfirmClear(false);
      toast.success({ title: 'Wishlist cleared', description: `Removed ${plural(count, 'course')}.` });
    } finally {
      setBulkAction(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="section-heading">Wishlist</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {courseIds.length} course{courseIds.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {courseIds.length > 0 && (
            <>
              <Button
                variant="primary"
                onClick={handleMoveAllToCart}
                disabled={bulkDisabled}
                isLoading={bulkAction === 'move'}
                loadingText="Moving…"
                icon={<ShoppingCart className="w-4 h-4" aria-hidden="true" />}
              >
                Move all to cart
              </Button>
              <Button
                variant="tertiary"
                onClick={() => setConfirmClear(true)}
                disabled={bulkDisabled}
                isLoading={bulkAction === 'clear'}
                loadingText="Clearing…"
                icon={<Trash2 className="w-4 h-4" aria-hidden="true" />}
              >
                Clear wishlist
              </Button>
            </>
          )}
          <Link href="/" className="btn-secondary">
            Browse courses
          </Link>
        </div>
      </div>

      {!hydrated || loading ? (
        <div className="course-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-ink-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-ink-100 rounded w-20" />
                <div className="h-4 bg-ink-100 rounded w-full" />
                <div className="h-3 bg-ink-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : courseIds.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">Your wishlist is empty</p>
          <p className="text-xs text-ink-400 mt-1">
            Tap the heart on any course to save it for later.
          </p>
          <Link href="/" className="btn-primary mt-4 inline-flex">
            Browse courses
          </Link>
        </div>
      ) : (
        <>
          <div className="course-grid">
            {saved.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {unavailable > 0 && (
            <p className="text-xs text-ink-400 mt-4">
              {unavailable} saved course{unavailable !== 1 ? 's' : ''} could not be loaded right now.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        destructive
        title="Clear your wishlist?"
        description={`This removes all ${plural(courseIds.length, 'saved course')}. You can save them again from any course page.`}
        confirmLabel="Clear wishlist"
        loadingText="Clearing…"
        isLoading={bulkAction === 'clear'}
        onConfirm={handleClearWishlist}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
