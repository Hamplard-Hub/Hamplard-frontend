import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course } from '@/types';

const { getCourse } = vi.hoisted(() => ({ getCourse: vi.fn() }));

vi.mock('@/lib/api/services', () => ({ coursesApi: { get: getCourse } }));
vi.mock('@/components/courses/CourseCard', () => ({
  CourseCard: ({ course }: { course: Course }) => <div data-testid="course-card">{course.title}</div>,
}));

import WishlistPage from '../page';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { useWishlistStore } from '@/lib/hooks/use-wishlist-store';

const course = (id: string, title: string) => ({ id, title, price: 20 }) as Course;
const COURSES: Record<string, Course> = {
  'c-1': course('c-1', 'Tailoring Basics'),
  'c-2': course('c-2', 'Street Photography'),
};

const renderPage = () =>
  render(
    <ToastProvider>
      <WishlistPage />
    </ToastProvider>,
  );

const moveAllButton = () => screen.getByRole('button', { name: /move all to cart/i });
const clearButton = () => screen.getByRole('button', { name: /clear wishlist/i });

describe('WishlistPage bulk actions', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ courseIds: ['c-1', 'c-2'] });
    getCourse.mockReset();
    getCourse.mockImplementation(async (id: string) => COURSES[id]);
  });

  it('moves every wishlist course into the cart and confirms with a toast', async () => {
    renderPage();
    expect(await screen.findAllByTestId('course-card')).toHaveLength(2);

    fireEvent.click(moveAllButton());

    expect(await screen.findByText('Moved 2 courses to your cart')).toBeInTheDocument();
    expect(useCartStore.getState().items.map((item) => item.courseId)).toEqual(['c-1', 'c-2']);
    expect(useWishlistStore.getState().courseIds).toEqual([]);
    expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
  });

  it('mentions courses that were already in the cart', async () => {
    useCartStore.getState().addItem(COURSES['c-1']);
    renderPage();
    await screen.findAllByTestId('course-card');

    fireEvent.click(moveAllButton());

    expect(await screen.findByText('Moved 2 courses to your cart')).toBeInTheDocument();
    expect(screen.getByText(/1 course already in your cart/i)).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('disables both buttons and shows a loading state while moving', async () => {
    // c-2 fails on first load, so the bulk action retries it — and we hold that retry open.
    let resolveRetry!: (value: Course) => void;
    getCourse.mockImplementation(async (id: string) => {
      if (id === 'c-2') throw new Error('offline');
      return COURSES[id];
    });
    renderPage();
    await screen.findByText(/1 saved course could not be loaded/i);

    getCourse.mockImplementation(() => new Promise<Course>((resolve) => (resolveRetry = resolve)));
    fireEvent.click(moveAllButton());

    const moving = await screen.findByRole('button', { name: /moving/i });
    expect(moving).toBeDisabled();
    expect(clearButton()).toBeDisabled();

    await act(async () => resolveRetry(COURSES['c-2']));

    expect(await screen.findByText('Moved 2 courses to your cart')).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('leaves courses that still cannot be loaded in the wishlist', async () => {
    getCourse.mockImplementation(async (id: string) => {
      if (id === 'c-2') throw new Error('gone');
      return COURSES[id];
    });
    renderPage();
    await screen.findByText(/1 saved course could not be loaded/i);

    fireEvent.click(moveAllButton());

    expect(await screen.findByText('Moved 1 course to your cart')).toBeInTheDocument();
    expect(screen.getByText(/1 course could not be loaded and stayed in your wishlist/i)).toBeInTheDocument();
    expect(useWishlistStore.getState().courseIds).toEqual(['c-2']);
  });

  it('asks for confirmation before clearing the wishlist', async () => {
    renderPage();
    await screen.findAllByTestId('course-card');

    fireEvent.click(clearButton());
    const dialog = screen.getByRole('alertdialog', { name: /clear your wishlist/i });
    expect(within(dialog).getByText(/removes all 2 saved courses/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useWishlistStore.getState().courseIds).toEqual(['c-1', 'c-2']);

    fireEvent.click(clearButton());
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: /clear wishlist/i }),
    );

    expect(await screen.findByText('Wishlist cleared')).toBeInTheDocument();
    expect(useWishlistStore.getState().courseIds).toEqual([]);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('keeps the empty state unchanged, with no bulk buttons', async () => {
    useWishlistStore.setState({ courseIds: [] });
    renderPage();

    expect(await screen.findByText(/your wishlist is empty/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /move all to cart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear wishlist/i })).not.toBeInTheDocument();
  });
});
