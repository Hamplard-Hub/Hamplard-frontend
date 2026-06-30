'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FAQItem = {
  question: string;
  answer: ReactNode;
};

type FAQAccordionProps = {
  items: FAQItem[];
  allowMultiple?: boolean;
  defaultOpenIndex?: number | null;
  className?: string;
};

export function FAQAccordion({
  items,
  allowMultiple = false,
  defaultOpenIndex = 0,
  className,
}: FAQAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(() => {
    if (typeof defaultOpenIndex === 'number') {
      return defaultOpenIndex >= 0 ? [defaultOpenIndex] : [];
    }
    return [];
  });
  const baseId = useId();

  const toggleItem = (index: number) => {
    setOpenIndexes((current) => {
      if (allowMultiple) {
        return current.includes(index) ? current.filter((item) => item !== index) : [...current, index];
      }

      return current.includes(index) ? [] : [index];
    });
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        const buttonId = `${baseId}-question-${index}`;
        const panelId = `${baseId}-answer-${index}`;

        return (
          <div key={item.question} className="overflow-hidden rounded-2xl border border-[#D5D2F6] bg-white/80 shadow-sm">
            <h3>
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(index)}
              >
                <span className="text-sm font-semibold text-[#26215C]">{item.question}</span>
                <ChevronDown
                  className={cn('h-5 w-5 shrink-0 text-[#7F77DD] transition-transform duration-300', isOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-7 text-[#5A5578]">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
