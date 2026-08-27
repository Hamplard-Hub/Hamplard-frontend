import { create } from 'zustand';

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
}

export const useSearchStore = create<SearchStore>((set, get) => ({
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
}));
