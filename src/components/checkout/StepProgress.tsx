'use client';

import { cn } from '@/lib/utils';

export const CHECKOUT_STEPS = [
  { step: 1, label: 'Order Review' },
  { step: 2, label: 'Payment' },
  { step: 3, label: 'Confirmation' },
] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]['step'];

interface StepProgressProps {
  currentStep: CheckoutStep;
  className?: string;
}

export function StepProgress({ currentStep, className }: StepProgressProps) {
  return (
    <nav aria-label="Checkout progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-center gap-0">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.step;
          const isCurrent = currentStep === step.step;
          const isFuture = currentStep < step.step;

          return (
            <li key={step.step} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                    isCompleted &&
                      'bg-leaf-600 text-white shadow-md shadow-leaf-600/20',
                    isCurrent &&
                      'bg-hamplard-primary text-white shadow-md shadow-hamplard-primary/20 ring-2 ring-hamplard-primary/30',
                    isFuture && 'bg-ink-100 text-ink-400',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    step.step
                  )}
                </span>
                <span
                  className={cn(
                    'mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-300',
                    isCompleted && 'text-leaf-700',
                    isCurrent && 'text-hamplard-primary font-semibold',
                    isFuture && 'text-ink-400',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < CHECKOUT_STEPS.length - 1 && (
                <div className="mx-3 flex-1">
                  <div
                    className={cn(
                      'h-0.5 rounded-full transition-all duration-500',
                      isCompleted ? 'bg-leaf-600' : 'bg-ink-200',
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
