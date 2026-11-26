import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gift } from '@/types';

const { apiGet, apiPost, push, toastSuccess, toastError } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'claim-abc' }),
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: apiGet, post: apiPost },
}));

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

import GiftClaimPage from '../claim/[token]/page';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

const baseGift = {
  id: 'gift-1',
  courseId: 'course-1',
  claimToken: 'claim-abc',
  recipientEmail: 'friend@example.com',
  senderEmail: null,
  message: 'Enjoy the course',
  deliveryDate: '2026-11-25',
  claimedAt: null,
  createdAt: '2026-11-24T10:00:00.000Z',
  course: {
    id: 'course-1',
    title: 'Tailoring Basics',
    thumbnailUrl: null,
    instructor: { name: 'Ada' },
  },
} as Gift;

const giftWithStatus = (status: Gift['status']): Gift => ({ ...baseGift, status });

describe('GiftClaimPage', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    push.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    useAuthStore.setState({ isConnected: true });
  });

  it('shows the loading state while the gift is fetched', () => {
    apiGet.mockReturnValue(new Promise(() => {}));
    render(<GiftClaimPage />);

    expect(screen.getByLabelText(/loading gift/i)).toBeInTheDocument();
  });

  it('renders a pending gift and marks it claimed', async () => {
    const user = userEvent.setup();
    apiGet.mockResolvedValue({ data: { data: giftWithStatus('PENDING') } });
    apiPost.mockResolvedValue({ data: { data: giftWithStatus('CLAIMED') } });
    render(<GiftClaimPage />);

    expect(await screen.findByText('You have a gift!')).toBeInTheDocument();
    expect(screen.getByText('Tailoring Basics')).toBeInTheDocument();
    expect(screen.getByText('"Enjoy the course"')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /claim my course/i }));

    expect(await screen.findByText('Gift already claimed')).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/gifts/claim/claim-abc');
    expect(toastSuccess).toHaveBeenCalledWith({
      title: 'Course claimed!',
      description: 'The gifted course has been added to your dashboard.',
    });
  });

  it('shows the already-claimed state for a claimed gift', async () => {
    apiGet.mockResolvedValue({ data: { data: giftWithStatus('CLAIMED') } });
    render(<GiftClaimPage />);

    expect(await screen.findByText('Gift already claimed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to my courses/i })).toHaveAttribute(
      'href',
      '/dashboard/my-courses',
    );
  });

  it('shows the expired state for an expired gift', async () => {
    apiGet.mockResolvedValue({ data: { data: giftWithStatus('EXPIRED') } });
    render(<GiftClaimPage />);

    expect(await screen.findByText('Gift unavailable')).toBeInTheDocument();
    expect(screen.getByText('This gift link has expired.')).toBeInTheDocument();
  });

  it('shows the API error state when the gift cannot be loaded', async () => {
    apiGet.mockRejectedValue(new Error('Gift not found.'));
    render(<GiftClaimPage />);

    expect(await screen.findByText('Gift unavailable')).toBeInTheDocument();
    expect(screen.getByText('Gift not found.')).toBeInTheDocument();
  });

  it('sends signed-out visitors to login instead of calling the claim API', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ isConnected: false });
    apiGet.mockResolvedValue({ data: { data: giftWithStatus('PENDING') } });
    render(<GiftClaimPage />);

    expect(await screen.findByText('You have a gift!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /sign in to claim/i }));

    expect(push).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fgift%2Fclaim%2Fclaim-abc',
    );
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('surfaces a claim failure and returns to the error state', async () => {
    const user = userEvent.setup();
    apiGet.mockResolvedValue({ data: { data: giftWithStatus('PENDING') } });
    apiPost.mockRejectedValue(new Error('Already claimed'));
    render(<GiftClaimPage />);

    expect(await screen.findByText('You have a gift!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /claim my course/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith({
        title: 'Claim failed',
        description: 'Already claimed',
      });
    });
    expect(screen.getByText('Gift unavailable')).toBeInTheDocument();
    expect(screen.getByText('Already claimed')).toBeInTheDocument();
  });
});
