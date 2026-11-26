import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course, Gift } from '@/types';

const { apiGet, apiPost, push, toastError } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'course-1' }),
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: apiGet, post: apiPost },
}));

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({ error: toastError, success: vi.fn() }),
}));

import GiftCheckoutPage from '../[courseId]/page';

const course = {
  id: 'course-1',
  title: 'Tailoring Basics',
  price: 49.5,
} as Course;

const gift = {
  id: 'gift-1',
  claimToken: 'claim-123',
} as Gift;

describe('GiftCheckoutPage', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    push.mockReset();
    toastError.mockReset();
    apiGet.mockResolvedValue({ data: { data: course } });
  });

  it('validates the gift form before calling the gifts API', async () => {
    const user = userEvent.setup();
    render(<GiftCheckoutPage />);

    expect(await screen.findByRole('heading', { name: /gift this course/i })).toBeInTheDocument();

    const email = screen.getByLabelText(/recipient email/i);
    await user.clear(email);
    await user.type(email, 'not-an-email');

    const deliveryDate = screen.getByLabelText(/delivery date/i);
    fireEvent.change(deliveryDate, { target: { value: '2000-01-01' } });

    await user.click(screen.getByRole('button', { name: /send this gift/i }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(
      screen.getByText('Delivery date must be today or in the future.'),
    ).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('submits a valid gift and redirects to the confirmation page', async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({ data: { data: gift } });
    render(<GiftCheckoutPage />);

    expect(await screen.findByRole('heading', { name: /gift this course/i })).toBeInTheDocument();

    const email = screen.getByLabelText(/recipient email/i);
    await user.clear(email);
    await user.type(email, 'friend@example.com');
    await user.type(screen.getByLabelText(/personal message/i), 'Enjoy the course');

    await user.click(screen.getByRole('button', { name: /send this gift/i }));

    const today = new Date().toISOString().split('T')[0];
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/gifts', {
        courseId: 'course-1',
        recipientEmail: 'friend@example.com',
        message: 'Enjoy the course',
        deliveryDate: today,
      });
    });
    expect(push).toHaveBeenCalledWith(
      '/gift/course-1/confirmation?token=claim-123&recipient=friend%40example.com',
    );
  });

  it('shows the linked API error and does not redirect when the gift fails', async () => {
    const user = userEvent.setup();
    apiPost.mockRejectedValue(new Error('Gift service unavailable'));
    render(<GiftCheckoutPage />);

    expect(await screen.findByRole('heading', { name: /gift this course/i })).toBeInTheDocument();

    const email = screen.getByLabelText(/recipient email/i);
    await user.clear(email);
    await user.type(email, 'friend@example.com');
    await user.click(screen.getByRole('button', { name: /send this gift/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith({
        title: 'Gift failed',
        description: 'Gift service unavailable',
      });
    });
    expect(push).not.toHaveBeenCalled();
  });
});
