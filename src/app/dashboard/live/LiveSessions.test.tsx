import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveSessionsPage from './page';
import { liveSessionsApi } from '@/lib/api/services';

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

const mockUpcomingSessions = [
  {
    id: 'session-soon',
    courseId: 'course-1',
    courseTitle: 'African Tailoring',
    title: 'Finishing French Seams Demo',
    description: 'Live interactive demonstration of enclosed seams.',
    instructorName: 'Master Chidi',
    // 5 minutes from now -> within 10 minutes -> joinable!
    scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    joinUrl: 'https://meet.hamplard.com/live-demo',
    status: 'UPCOMING' as const,
    registeredCount: 30,
    isRegistered: true,
  },
  {
    id: 'session-future',
    courseId: 'course-2',
    courseTitle: 'Cake Artistry',
    title: 'Fondant Sculpture Workshop',
    description: 'Hands on sculpting methods for celebration cakes.',
    instructorName: 'Chef Amara',
    // 3 days from now -> not joinable yet
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    durationMinutes: 90,
    joinUrl: 'https://meet.hamplard.com/live-cake',
    status: 'UPCOMING' as const,
    registeredCount: 15,
    isRegistered: false,
  },
];

const mockPastRecordings = [
  {
    id: 'rec-1',
    sessionId: 'session-1',
    title: 'Sourdough Starters & Proofing',
    description: 'Baking masterclass recording on fermentation.',
    instructorName: 'Chef Amara',
    recordedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    durationMinutes: 45,
    videoUrl: 'https://www.youtube-nocookie.com/embed/example',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    viewsCount: 120,
  },
];

describe('LiveSessionsPage (Issue #402)', () => {
  beforeEach(() => {
    vi.spyOn(liveSessionsApi, 'getUpcoming').mockResolvedValue(mockUpcomingSessions);
    vi.spyOn(liveSessionsApi, 'getPastRecordings').mockResolvedValue(mockPastRecordings);
  });

  it('renders local time zone indicator and upcoming sessions list', async () => {
    render(<LiveSessionsPage />);

    expect(screen.getByText(/live sessions & workshops/i)).toBeInTheDocument();
    expect(screen.getByText(/local time zone/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Finishing French Seams Demo')).toBeInTheDocument();
      expect(screen.getByText('Fondant Sculpture Workshop')).toBeInTheDocument();
    });
  });

  it('enables Join button within 10 minutes of start time and disables it otherwise', async () => {
    render(<LiveSessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Finishing French Seams Demo')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByRole('button', { name: /join/i });
    expect(joinButtons.length).toBeGreaterThanOrEqual(2);

    // First session starts in 5 minutes -> joinable!
    expect(joinButtons[0]).not.toBeDisabled();

    // Second session starts in 3 days -> disabled!
    expect(joinButtons[1]).toBeDisabled();
  });

  it('switches to Past Recordings tab and displays recorded sessions', async () => {
    render(<LiveSessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Finishing French Seams Demo')).toBeInTheDocument();
    });

    const recordingsTab = screen.getByRole('button', { name: /past recordings/i });
    fireEvent.click(recordingsTab);

    await waitFor(() => {
      expect(screen.getByText('Sourdough Starters & Proofing')).toBeInTheDocument();
      expect(screen.getByText(/120 views/i)).toBeInTheDocument();
    });
  });
});
