import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortOption =
  | 'relevance'
  | 'rating'
  | 'popular'
  | 'newest'
  | 'price-low'
  | 'price-high';

/** Duration buckets keyed off `course.totalDuration` (minutes). */
export type DurationBucket = 'short' | 'medium' | 'long';

export const DURATION_BUCKETS: { value: DurationBucket; label: string }[] = [
  { value: 'short', label: 'Short (under 3h)' },
  { value: 'medium', label: 'Medium (3–10h)' },
  { value: 'long', label: 'Long (over 10h)' },
];

/** Maps a course's total minutes onto a duration bucket. */
export function durationToBucket(totalMinutes: number): DurationBucket {
  if (totalMinutes < 180) return 'short';
  if (totalMinutes <= 600) return 'medium';
  return 'long';
}

export interface PriceRange {
  min: number;
  /** `null` means "no upper bound". */
  max: number | null;
}

export const DEFAULT_PRICE_RANGE: PriceRange = { min: 0, max: null };

/** Maximum number of recent searches retained in history. */
export const MAX_RECENT_SEARCHES = 5;

/** A reusable snapshot of the query plus all active filters. */
export interface SearchSnapshot {
  query: string;
  sortBy: SortOption;
  selectedCategories: string[];
  selectedLevels: string[];
  selectedDurations: DurationBucket[];
  priceRange: PriceRange;
  minRating: number;
}

export interface RecentSearch extends SearchSnapshot {
  /** Epoch millis of when the search was recorded. */
  timestamp: number;
}

export interface SavedSearch extends SearchSnapshot {
  id: string;
  /** User-facing label, defaults to the query text. */
  name: string;
  timestamp: number;
}

interface SearchStore {
  query: string;
  setQuery: (query: string) => void;

  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;

  selectedCategories: string[];
  toggleCategory: (category: string) => void;

  selectedLevels: string[];
  toggleLevel: (level: string) => void;

  selectedDurations: DurationBucket[];
  toggleDuration: (bucket: DurationBucket) => void;

  priceRange: PriceRange;
  setPriceRange: (range: PriceRange) => void;

  /** Minimum star rating (0 = any). */
  minRating: number;
  setMinRating: (rating: number) => void;

  /** Count of active filters, excluding the free-text query and sort. */
  activeFilterCount: () => number;

  clearFilters: () => void;

  /** Most recent searches, newest first (capped at MAX_RECENT_SEARCHES). */
  recentSearches: RecentSearch[];
  /** Records the current query/filters into recent history. */
  addRecentSearch: () => void;
  /** Removes all recent search entries. */
  clearHistory: () => void;

  /** User-saved searches for later reuse. */
  savedSearches: SavedSearch[];
  /** Saves the current query/filters for later reuse. */
  saveSearch: (name?: string) => void;
  /** Removes a saved search by id. */
  removeSavedSearch: (id: string) => void;
  /** Re-applies a stored query/filters snapshot to the active search. */
  applySearch: (snapshot: SearchSnapshot) => void;
}

/** Captures the current query and filter state as a reusable snapshot. */
function snapshot(state: SearchStore): SearchSnapshot {
  return {
    query: state.query,
    sortBy: state.sortBy,
    selectedCategories: state.selectedCategories,
    selectedLevels: state.selectedLevels,
    selectedDurations: state.selectedDurations,
    priceRange: state.priceRange,
    minRating: state.minRating,
  };
}

/** True when a snapshot has no query text and no active filters. */
function isEmptySnapshot(s: SearchSnapshot): boolean {
  return (
    s.query.trim() === '' &&
    s.selectedCategories.length === 0 &&
    s.selectedLevels.length === 0 &&
    s.selectedDurations.length === 0 &&
    s.minRating === 0 &&
    s.priceRange.min === DEFAULT_PRICE_RANGE.min &&
    s.priceRange.max === DEFAULT_PRICE_RANGE.max
  );
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      query: '',
      setQuery: (query: string) => set({ query }),

      sortBy: 'relevance',
      setSortBy: (sortBy) => set({ sortBy }),

      selectedCategories: [],
      toggleCategory: (category: string) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.includes(category)
            ? state.selectedCategories.filter((c) => c !== category)
            : [...state.selectedCategories, category],
        })),

      selectedLevels: [],
      toggleLevel: (level: string) =>
        set((state) => ({
          selectedLevels: state.selectedLevels.includes(level)
            ? state.selectedLevels.filter((l) => l !== level)
            : [...state.selectedLevels, level],
        })),

      selectedDurations: [],
      toggleDuration: (bucket: DurationBucket) =>
        set((state) => ({
          selectedDurations: state.selectedDurations.includes(bucket)
            ? state.selectedDurations.filter((d) => d !== bucket)
            : [...state.selectedDurations, bucket],
        })),

      priceRange: DEFAULT_PRICE_RANGE,
      setPriceRange: (priceRange) => set({ priceRange }),

      minRating: 0,
      setMinRating: (minRating) => set({ minRating }),

      activeFilterCount: () => {
        const s = get();
        const priceActive =
          s.priceRange.min !== DEFAULT_PRICE_RANGE.min ||
          s.priceRange.max !== DEFAULT_PRICE_RANGE.max;
        return (
          s.selectedCategories.length +
          s.selectedLevels.length +
          s.selectedDurations.length +
          (s.minRating > 0 ? 1 : 0) +
          (priceActive ? 1 : 0)
        );
      },

      clearFilters: () =>
        set({
          query: '',
          sortBy: 'relevance',
          selectedCategories: [],
          selectedLevels: [],
          selectedDurations: [],
          priceRange: DEFAULT_PRICE_RANGE,
          minRating: 0,
        }),

      recentSearches: [],
      addRecentSearch: () => {
        const current = snapshot(get());
        if (isEmptySnapshot(current)) return;
        set((state) => {
          const deduped = state.recentSearches.filter(
            (r) =>
              r.query !== current.query ||
              r.minRating !== current.minRating ||
              r.selectedCategories.join(',') !==
                current.selectedCategories.join(',') ||
              r.selectedLevels.join(',') !== current.selectedLevels.join(',') ||
              r.selectedDurations.join(',') !==
                current.selectedDurations.join(','),
          );
          return {
            recentSearches: [
              { ...current, timestamp: Date.now() },
              ...deduped,
            ].slice(0, MAX_RECENT_SEARCHES),
          };
        });
      },
      clearHistory: () => set({ recentSearches: [] }),

      savedSearches: [],
      saveSearch: (name?: string) => {
        const current = snapshot(get());
        if (isEmptySnapshot(current)) return;
        set((state) => ({
          savedSearches: [
            {
              ...current,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: name?.trim() || current.query.trim() || 'Saved search',
              timestamp: Date.now(),
            },
            ...state.savedSearches,
          ],
        }));
      },
      removeSavedSearch: (id: string) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        })),
      applySearch: (snap: SearchSnapshot) =>
        set({
          query: snap.query,
          sortBy: snap.sortBy,
          selectedCategories: snap.selectedCategories,
          selectedLevels: snap.selectedLevels,
          selectedDurations: snap.selectedDurations,
          priceRange: snap.priceRange,
          minRating: snap.minRating,
        }),
    }),
    {
      name: 'search-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        savedSearches: state.savedSearches,
      }),
    },
  ),
);
