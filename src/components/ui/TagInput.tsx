'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react';
import { X, Tag } from 'lucide-react';
import { tagsApi } from '@/lib/api/services';
import { cn } from '@/lib/utils';

const MAX_TAGS = 10;
const DEBOUNCE_MS = 300;

interface TagInputProps {
  /** Controlled value */
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Extra class names on the outer wrapper */
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Type a skill or topic…',
  className,
  disabled = false,
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = MAX_TAGS - value.length;
  const atMax = remaining <= 0;

  // ── Fetch suggestions with debounce ──────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (inputValue.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await tagsApi.search(inputValue);
        // Exclude already-selected tags
        const filtered = results.filter(
          (r) => !value.includes(r),
        );
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  // ── Add a tag ─────────────────────────────────────────────────────────
  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || value.includes(trimmed) || atMax) return;
      onChange([...value, trimmed]);
      setInputValue('');
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [atMax, onChange, value],
  );

  // ── Remove a tag ──────────────────────────────────────────────────────
  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
      inputRef.current?.focus();
    },
    [onChange, value],
  );

  // ── Keyboard navigation ───────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          addTag(suggestions[activeIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;

      case 'Backspace':
        if (inputValue === '' && value.length > 0) {
          removeTag(value[value.length - 1]);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;

      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      case ',':
      case 'Tab':
        if (inputValue.trim()) {
          e.preventDefault();
          addTag(inputValue);
        }
        break;
    }
  };

  // ── Scroll active suggestion into view ───────────────────────────────
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // ── Close dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.closest('[data-tag-input]')?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={cn('space-y-1.5', className)} data-tag-input>
      {/* Tag count indicator */}
      <div
        className={cn(
          'text-xs font-medium',
          atMax ? 'text-amber-600' : 'text-ink-400',
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value.length} of {MAX_TAGS} tags added
        {atMax && ' — remove a tag to add more'}
      </div>

      {/* Input wrapper */}
      <div
        className={cn(
          'relative flex min-h-[2.75rem] w-full flex-wrap gap-1.5 rounded-xl border bg-white px-2.5 py-2 transition-all focus-within:border-[var(--color-focus-ring)] focus-within:[box-shadow:var(--shadow-focus)]',
          disabled ? 'cursor-not-allowed bg-ink-50 opacity-60' : 'cursor-text',
          'border-[var(--color-border-default)]',
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
        role="group"
        aria-label="Tags"
      >
        {/* Pill tags */}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-saffron-50 px-2.5 py-1 text-xs font-medium text-saffron-800"
          >
            <Tag className="h-3 w-3 shrink-0 text-saffron-500" aria-hidden="true" />
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-0.5 rounded-full p-0.5 text-saffron-500 transition-colors hover:bg-saffron-100 hover:text-saffron-700"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            )}
          </span>
        ))}

        {/* Text input */}
        {!atMax && !disabled && (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[8rem] flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? 'tag-suggestions' : undefined}
            aria-activedescendant={
              activeIndex >= 0 ? `tag-suggestion-${activeIndex}` : undefined
            }
            role="combobox"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="relative z-20">
          <ul
            ref={listRef}
            id="tag-suggestions"
            role="listbox"
            aria-label="Tag suggestions"
            className="absolute top-1 w-full overflow-auto rounded-xl border border-ink-100 bg-white py-1 shadow-lg"
            style={{ maxHeight: '13rem' }}
          >
            {suggestions.map((s, i) => (
              <li
                key={s}
                id={`tag-suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep input focused
                  addTag(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3.5 py-2 text-sm transition-colors',
                  i === activeIndex
                    ? 'bg-saffron-50 text-saffron-800'
                    : 'text-ink-700 hover:bg-ink-50',
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keyboard hint */}
      {!atMax && !disabled && (
        <p className="text-[11px] text-ink-400">
          Press <kbd className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{' '}
          or{' '}
          <kbd className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px]">,</kbd> to add ·{' '}
          <kbd className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px]">Backspace</kbd> to
          remove last
        </p>
      )}
    </div>
  );
}
