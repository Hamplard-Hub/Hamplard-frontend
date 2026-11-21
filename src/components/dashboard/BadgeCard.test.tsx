import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BadgeCard } from './BadgeCard';
import type { Achievement } from '@/types';

const earnedBadge: Achievement = {
  id: 'first-lesson',
  title: 'First Step',
  description: 'Completed your first lesson on Hamplard.',
  criteria: 'Complete any 1 lesson in any enrolled course.',
  icon: 'BookOpen',
  category: 'learning',
  earned: true,
  earnedAt: '2026-10-18T10:00:00.000Z',
  progress: 100,
  rarity: 'common',
};

const lockedBadge: Achievement = {
  id: 'streak-7',
  title: '7-Day Streak',
  description: 'Learned consistently for 7 consecutive days.',
  criteria: 'Maintain an uninterrupted learning streak of 7 days.',
  icon: 'Flame',
  category: 'streak',
  earned: false,
  earnedAt: null,
  progress: 45,
  rarity: 'rare',
};

describe('BadgeCard Component', () => {
  it('renders earned badge with earned status and date', () => {
    render(<BadgeCard badge={earnedBadge} />);
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText(/Earned Oct 18, 2026/)).toBeInTheDocument();
  });

  it('renders locked badge with locked status and progress bar', () => {
    render(<BadgeCard badge={lockedBadge} />);
    expect(screen.getByText('7-Day Streak')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('opens detail modal on click displaying criteria and social share', () => {
    const onSelect = vi.fn();
    render(<BadgeCard badge={earnedBadge} onSelect={onSelect} />);

    const card = screen.getByRole('button', { name: /First Step badge/i });
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(earnedBadge);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('How to earn')).toBeInTheDocument();
    expect(screen.getByText(earnedBadge.criteria)).toBeInTheDocument();
    expect(screen.getByText('Share your achievement')).toBeInTheDocument();
  });
});
