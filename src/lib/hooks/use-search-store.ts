import { create } from 'zustand';

interface SearchStore {
  query: string;
  setQuery: (query: string) => void;
  sortBy: 'relevance' | 'rating' | 'price-low' | 'price-high' | 'newest';
  setSortBy: (sort: 'relevance' | 'rating' | 'price-low' | 'price-high' | 'newest') => void;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
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

  clearFilters: () =>
    set({
      query: '',
      sortBy: 'relevance',
      selectedCategories: [],
    }),
}));
