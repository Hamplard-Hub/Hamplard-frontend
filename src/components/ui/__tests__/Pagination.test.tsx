import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/courses',
  useSearchParams: () => new URLSearchParams(),
}));

function jumpTo(value: string) {
  const input = screen.getByLabelText('Jump to page');
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('Pagination jump-to-page', () => {
  beforeEach(() => push.mockClear());

  it('navigates to a valid page when Enter is pressed', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={20} onPageChange={onPageChange} />);

    jumpTo('12');

    expect(onPageChange).toHaveBeenCalledWith(12);
    expect(push).toHaveBeenCalledWith('/courses?page=12', { scroll: false });
  });

  it('navigates when the Go button is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={20} onPageChange={onPageChange} updateUrl={false} />);

    fireEvent.change(screen.getByLabelText('Jump to page'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Go to entered page' }));

    expect(onPageChange).toHaveBeenCalledWith(7);
    expect(push).not.toHaveBeenCalled();
  });

  it('clamps values above the total to the last page', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={20} onPageChange={onPageChange} />);

    jumpTo('99');

    expect(onPageChange).toHaveBeenCalledWith(20);
  });

  it('clamps values below 1 to the first page', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={20} onPageChange={onPageChange} />);

    jumpTo('-3');

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('ignores empty input and clears the field after jumping', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={20} onPageChange={onPageChange} />);

    jumpTo('');
    expect(onPageChange).not.toHaveBeenCalled();

    jumpTo('3');
    expect(screen.getByLabelText('Jump to page')).toHaveValue(null);
  });

  it('does not trigger prev/next when arrow keys are pressed inside the input', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.keyDown(screen.getByLabelText('Jump to page'), { key: 'ArrowRight' });

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps existing prev/next and page buttons working', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);

    fireEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);

    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });
});
