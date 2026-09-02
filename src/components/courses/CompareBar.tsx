'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCompareStore } from '@/lib/hooks/use-compare-store';
import { cn } from '@/lib/utils';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAHklEQVQI12NgYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==';

export function CompareBar() {
  const router = useRouter();
  const courses = useCompareStore((state) => state.courses);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);

  if (courses.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            <span className="text-sm font-semibold text-ink-900 whitespace-nowrap">
              Compare ({courses.length}/3)
            </span>
            <div className="flex gap-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="relative flex items-center gap-2 bg-ink-50 rounded-lg p-2 pr-8"
                >
                  <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-saffron-100 to-saffron-200">
                        <span className="text-lg">
                          {course.category === 'Tailoring' ? '🧵' :
                           course.category === 'Baking' ? '🍰' :
                           course.category === 'Photography' ? '📷' :
                           course.category === 'Makeup Artistry' ? '💄' :
                           course.category === 'Hairstyling' ? '💇' :
                           course.category === 'Nail Technology' ? '💅' : '🎓'}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-ink-700 max-w-[120px] truncate">
                    {course.title}
                  </span>
                  <button
                    onClick={() => remove(course.id)}
                    aria-label={`Remove ${course.title} from comparison`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-ink-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-ink-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/compare')}
              className="btn-primary px-6 py-2 text-sm whitespace-nowrap"
            >
              Compare Now
            </button>
            <button
              onClick={clear}
              className="btn-secondary px-4 py-2 text-sm whitespace-nowrap"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
