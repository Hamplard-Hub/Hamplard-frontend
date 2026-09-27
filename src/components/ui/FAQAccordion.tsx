'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';
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

function getAnswerText(answer: ReactNode): string {
  if (answer == null || typeof answer === 'boolean') return '';
  if (typeof answer === 'string' || typeof answer === 'number') return String(answer);
  if (Array.isArray(answer)) return answer.map(getAnswerText).join(' ');
  if (typeof answer === 'object' && 'props' in answer) {
    return getAnswerText((answer as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

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
  const [query, setQuery] = useState('');
  const baseId = useId();

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredItems = useMemo(() => {
    if (!isSearching) return items.map((item, index) => ({ item, index }));

    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const haystack = `${item.question} ${getAnswerText(item.answer)}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [items, isSearching, normalizedQuery]);

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
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F77DD]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search FAQs..."
          aria-label="Search FAQs"
          className="w-full rounded-2xl border border-[#D5D2F6] bg-white/80 py-3 pl-11 pr-4 text-sm text-[#26215C] shadow-sm outline-none transition focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/30"
        />
      </div>

      {isSearching && filteredItems.length === 0 ? (
        <p className="rounded-2xl border border-[#D5D2F6] bg-white/80 px-5 py-4 text-sm text-[#5A5578] shadow-sm">
          No results found for “{query.trim()}”.
        </p>
      ) : (
        filteredItems.map(({ item, index }) => {
          const isOpen = isSearching || openIndexes.includes(index);
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
        })
      )}
    </div>
  );
}
