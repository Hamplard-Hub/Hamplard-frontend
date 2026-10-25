'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Clock, Play, ListChecks, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stepChecklistApi } from '@/lib/api/services';
import { Lightbox } from '@/components/ui/Lightbox';
import type { LessonStep } from '@/types';

export interface StepChecklistProps {
  lessonId: string;
  steps: LessonStep[];
  onSeek?: (timestamp: number) => void;
  className?: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StepChecklist({
  lessonId,
  steps,
  onSeek,
  className,
}: StepChecklistProps) {
  const storageKey = `hamplard:lesson-steps:${lessonId}`;

  // Initialize from localStorage fallback
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {
      // Ignore storage parse errors
    }
    return new Set();
  });

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const stepImages = useMemo(() => {
    return steps
      .filter((s): s is LessonStep & { imageUrl: string } => !!s.imageUrl)
      .map((s) => ({
        src: s.imageUrl,
        title: s.title,
        description: s.description ?? undefined,
      }));
  }, [steps]);

  // Re-sync with localStorage and API when lessonId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialSet = new Set<string>();
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initialSet = new Set(parsed);
        }
      }
    } catch {
      // ignore
    }
    setCompletedSteps(initialSet);

    // Fetch from API in background, fallback to localStorage
    let active = true;
    stepChecklistApi
      .getStepProgress(lessonId)
      .then((serverCompleted) => {
        if (active && Array.isArray(serverCompleted)) {
          const merged = new Set([...Array.from(initialSet), ...serverCompleted]);
          setCompletedSteps(merged);
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(merged)));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Silently use localStorage fallback
      });

    return () => {
      active = false;
    };
  }, [lessonId, storageKey]);

  const handleToggleStep = useCallback(
    (stepId: string) => {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        if (next.has(stepId)) {
          next.delete(stepId);
        } else {
          next.add(stepId);
        }

        const nextArr = Array.from(next);

        // Save to localStorage
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(nextArr));
        } catch {
          // ignore
        }

        // Save to API
        stepChecklistApi.saveStepProgress(lessonId, nextArr).catch(() => {
          // localStorage already persisted
        });

        return next;
      });
    },
    [lessonId, storageKey],
  );

  const totalSteps = steps.length;
  const completedCount = useMemo(() => {
    return steps.filter((step) => completedSteps.has(step.id)).length;
  }, [steps, completedSteps]);

  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (totalSteps === 0) return null;

  return (
    <div className={cn('rounded-2xl border border-ink-100 bg-white p-5 shadow-sm', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-600 flex items-center justify-center">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Step-by-Step Practice</h3>
            <p className="text-xs text-ink-500">
              {completedCount} of {totalSteps} steps done
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-saffron-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-ink-700 min-w-[2.5rem] text-right">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Steps List */}
      <ol className="mt-4 space-y-3.5">
        {steps.map((step, index) => {
          const isDone = completedSteps.has(step.id);
          const stepNumber = step.stepNumber ?? index + 1;

          return (
            <li
              key={step.id}
              className={cn(
                'group relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all',
                isDone
                  ? 'border-leaf-200 bg-leaf-50/30'
                  : 'border-ink-100 bg-ink-50/30 hover:border-saffron-200 hover:bg-white',
              )}
            >
              {/* Checkbox */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                aria-label={`Mark step ${stepNumber}: ${step.title} as ${isDone ? 'incomplete' : 'complete'}`}
                onClick={() => handleToggleStep(step.id)}
                className={cn(
                  'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-white transition-all focus:outline-none focus:ring-2 focus:ring-saffron-500/40',
                  isDone
                    ? 'border-leaf-500 bg-leaf-500 hover:bg-leaf-600'
                    : 'border-ink-300 bg-white hover:border-saffron-500',
                )}
              >
                {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-ink-400">
                      {stepNumber}.
                    </span>
                    <h4
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isDone ? 'text-ink-500 line-through' : 'text-ink-900',
                      )}
                    >
                      {step.title}
                    </h4>
                  </div>

                  {/* Optional video timestamp seeking button */}
                  {step.timestamp !== undefined && step.timestamp !== null && (
                    <button
                      type="button"
                      onClick={() => onSeek?.(step.timestamp!)}
                      className="inline-flex items-center gap-1 rounded-md bg-saffron-50 px-2 py-0.5 text-xs font-medium text-saffron-700 hover:bg-saffron-100 hover:text-saffron-800 transition-colors"
                      title={`Jump video to ${formatTimestamp(step.timestamp)}`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>{formatTimestamp(step.timestamp)}</span>
                    </button>
                  )}
                </div>

                {/* Optional description */}
                {step.description && (
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed',
                      isDone ? 'text-ink-400' : 'text-ink-600',
                    )}
                  >
                    {step.description}
                  </p>
                )}

                {/* Optional image preview with zoom lightbox trigger */}
                {step.imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = stepImages.findIndex((img) => img.src === step.imageUrl);
                      setActiveImageIndex(idx >= 0 ? idx : 0);
                    }}
                    className="group relative mt-2.5 overflow-hidden rounded-lg border border-ink-100 max-w-xs block text-left focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
                    aria-label={`Enlarge image for ${step.title}`}
                  >
                    <img
                      src={step.imageUrl}
                      alt={step.title}
                      className="w-full h-auto object-cover max-h-48 transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="p-1.5 rounded-full bg-black/60 text-white shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <Lightbox
        images={stepImages}
        initialIndex={activeImageIndex ?? 0}
        isOpen={activeImageIndex !== null}
        onClose={() => setActiveImageIndex(null)}
      />
    </div>
  );
}

export default StepChecklist;
