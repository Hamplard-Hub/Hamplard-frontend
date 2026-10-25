import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Pagination } from '@/components/ui/Pagination';

const mockPush = vi.fn();
const mockGet = vi.fn((_key: string) => null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/courses',
  useSearchParams: () => ({ get: mockGet, toString: () => '' }),
}));

describe('Pagination Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page numbers correctly for small total counts', () => {
    render(<Pagination currentPage={1} totalPages={5} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('shows ellipsis for large page ranges', () => {
    render(<Pagination currentPage={5} totalPages={10} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
    const ellipsisElements = screen.getAllByText('…');
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });

  it('disables Previous button at start boundary', () => {
    render(<Pagination currentPage={1} totalPages={5} updateUrl={false} />);
    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('disables Next button at end boundary', () => {
    render(<Pagination currentPage={5} totalPages={5} updateUrl={false} />);
    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('applies aria-current and #7F77DD background styling to current page', () => {
    render(<Pagination currentPage={3} totalPages={5} updateUrl={false} />);
    const activeBtn = screen.getByRole('button', { name: 'Page 3' });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
    expect(activeBtn.className).toContain('bg-[#7F77DD]');
  });

  it('calculates totalPages from totalItems and itemsPerPage when totalPages is omitted', () => {
    render(<Pagination currentPage={1} totalItems={45} itemsPerPage={10} updateUrl={false} />);
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('triggers onPageChange and updates URL search params when page button is clicked', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} paramName="page" />);

    const page2Btn = screen.getByRole('button', { name: 'Page 2' });
    fireEvent.click(page2Btn);

    expect(handlePageChange).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith('/courses?page=2', { scroll: false });
  });
});
