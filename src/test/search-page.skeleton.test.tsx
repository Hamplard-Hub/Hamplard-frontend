import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useSearchStore } from '@/lib/hooks/use-search-store';
import { SearchPageHarness } from '@/test/SearchPageHarness';

const mockUseSearchParams = vi.fn(() => ({ get: (key: string) => (key === 'q' ? 'tailoring' : null) }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  // CourseCard's hover prefetch calls useRouter().prefetch() — provide a stub.
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/search/SearchBar', () => ({
  SearchBar: () => React.createElement('div', { 'data-testid': 'search-bar' }),
}));

describe('Search page skeleton loading states', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSearchStore.setState({
      query: '',
      sortBy: 'relevance',
      selectedCategories: [],
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders skeleton grid and sidebar while loading', async () => {
    render(React.createElement(SearchPageHarness));

    expect(screen.getAllByLabelText(/loading course/i)).toHaveLength(8);
    expect(screen.getByTestId('results-count-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('filter-sidebar-skeleton')).toBeInTheDocument();
  });

  it('replaces skeletons with real content after results load', async () => {
    render(React.createElement(SearchPageHarness));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByLabelText(/loading course/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('results-count-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-sidebar-skeleton')).not.toBeInTheDocument();
  });
});
