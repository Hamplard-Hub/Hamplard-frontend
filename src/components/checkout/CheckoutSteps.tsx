'use client';

import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description: string;
}

interface CheckoutStepsProps {
  steps: Step[];
  currentStep: number;
}

export function CheckoutSteps({ steps, currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <li key={step.label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isComplete && 'bg-leaf-600 text-white',
                    isCurrent && 'border-2 border-hamplard-primary text-hamplard-primary',
                    !isComplete && !isCurrent && 'border-2 border-ink-200 text-ink-400',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </span>
                <span className="hidden sm:block">
                  <span
                    className={cn(
                      'block text-sm font-medium leading-tight',
                      isCurrent && 'text-ink-900',
                      isComplete && 'text-ink-600',
                      !isComplete && !isCurrent && 'text-ink-400',
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block text-xs text-ink-500">{step.description}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px w-8 sm:w-16 transition-colors',
                    isComplete ? 'bg-leaf-600' : 'bg-ink-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
