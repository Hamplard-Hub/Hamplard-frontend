'use client';

import React, { useMemo } from 'react';

/** Classic iterative Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Returns the closest dictionary term to `query` within an edit-distance
 * threshold, or `null` when the query already matches or nothing is close.
 */
export function findSuggestion(query: string, dictionary: string[]): string | null {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 3) return null;

  let best: string | null = null;
  let bestDistance = Infinity;

  for (const term of dictionary) {
    const lower = term.toLowerCase();
    if (lower === trimmed) return null; // already an exact term — no suggestion needed
    const distance = levenshtein(trimmed, lower);
    // Scale the tolerance with word length so long terms allow more slack.
    const threshold = Math.max(1, Math.floor(lower.length / 4)) + 1;
    if (distance < bestDistance && distance <= threshold) {
      best = term;
      bestDistance = distance;
    }
  }

  return best;
}

interface DidYouMeanProps {
  query: string;
  dictionary: string[];
  onSelect: (term: string) => void;
}

export function DidYouMean({ query, dictionary, onSelect }: DidYouMeanProps) {
  const suggestion = useMemo(
    () => findSuggestion(query, dictionary),
    [query, dictionary],
  );

  if (!suggestion) return null;

  return (
    <p className="text-sm text-ink-600">
      Did you mean{' '}
      <button
        type="button"
        onClick={() => onSelect(suggestion)}
        className="font-semibold text-hamplard-mid underline underline-offset-2 hover:text-hamplard-primary"
      >
        {suggestion}
      </button>
      ?
    </p>
  );
}
