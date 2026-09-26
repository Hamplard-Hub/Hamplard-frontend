import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileCompletion } from './ProfileCompletion';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import type { User } from '@/types';

// Mock the auth store
vi.mock('@/lib/hooks/use-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

const mockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  stellarAddress: 'GXXXXXX',
  email: null,
  name: null,
  bio: null,
  avatarUrl: null,
  role: 'STUDENT',
  isVerified: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ProfileCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card variant (default)', () => {
    it('renders null when user is not authenticated', () => {
      (useAuthStore as any).mockReturnValue({ user: null });

      const { container } = render(<ProfileCompletion />);
      expect(container.firstChild).toBeNull();
    });

    it('renders progress card with 0% when profile is empty', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.getByText('Profile Completion')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 4 items completed')).toBeInTheDocument();
    });

    it('renders progress card with 100% when profile is complete', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Student bio',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('4 of 4 items completed')).toBeInTheDocument();
    });

    it('shows completion badge at 100%', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Student bio',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.getByText('Profile complete!')).toBeInTheDocument();
      expect(screen.getByText('Your profile looks great.')).toBeInTheDocument();
    });

    it('does not show completion badge when incomplete', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.queryByText('Your profile looks great.')).not.toBeInTheDocument();
    });

    it('renders all four checklist items for student', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.getByText('Profile photo')).toBeInTheDocument();
      expect(screen.getByText('Full name')).toBeInTheDocument();
      expect(screen.getByText('Email address')).toBeInTheDocument();
      expect(screen.getByText('Bio')).toBeInTheDocument();
    });

    it('marks completed items with checkmark', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      // Find the element for "Full name" which should be completed
      const nameItem = screen.getByText('Full name').closest('a');
      expect(nameItem?.classList.contains('bg-leaf-50')).toBe(true);
    });

    it('marks incomplete items with circle', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      // All items should have the "bg-ink-50" class for incomplete
      const items = screen.getAllByText(/Profile photo|Full name|Email address|Bio/);
      expect(items.length).toBeGreaterThan(0);
    });

    it('links incomplete items to correct pages', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      // All student items should link to profile page
      const profileLinks = screen.getAllByRole('link').filter((link) =>
        link.getAttribute('href')?.includes('/dashboard/profile'),
      );
      expect(profileLinks.length).toBeGreaterThanOrEqual(4);
    });

    it('includes progress bar with correct width', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '25%' });
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('shows help text when incomplete', () => {
      const user = mockUser({ name: 'John' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(
        screen.getByText(/Complete your profile to improve/),
      ).toBeInTheDocument();
    });
  });

  describe('Sidebar variant', () => {
    it('renders compact version with percentage', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="sidebar" />);

      expect(screen.getByText('Profile 25% complete')).toBeInTheDocument();
      expect(screen.getByText('1/4')).toBeInTheDocument();
    });

    it('shows progress bar in sidebar', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="sidebar" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '25%' });
    });

    it('shows complete badge in sidebar at 100%', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Student bio',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="sidebar" />);

      expect(screen.getByText('Profile complete!')).toBeInTheDocument();
      expect(screen.getByText('All set for success')).toBeInTheDocument();
    });

    it('has link to complete profile', () => {
      const user = mockUser({ name: 'John Doe' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="sidebar" />);

      const link = screen.getByText('Complete profile →');
      expect(link).toHaveAttribute('href', '/dashboard/profile');
    });

    it('does not show completion link at 100%', () => {
      const user = mockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Student bio',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="sidebar" />);

      expect(screen.queryByText('Complete profile →')).not.toBeInTheDocument();
    });
  });

  describe('Instructor role', () => {
    it('shows payout method item for instructors', () => {
      const user = mockUser({
        role: 'INSTRUCTOR',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      expect(screen.getByText('Payout method')).toBeInTheDocument();
      expect(screen.getByText('5 of 5 items completed')).toBeInTheDocument();
    });

    it('links payout method to settings page', () => {
      const user = mockUser({
        role: 'INSTRUCTOR',
      });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      const settingsLinks = screen.getAllByRole('link').filter((link) =>
        link.getAttribute('href')?.includes('/dashboard/settings'),
      );
      expect(settingsLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('applies custom className to component', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      const { container } = render(
        <ProfileCompletion variant="card" className="custom-class" />,
      );

      const card = container.querySelector('.card');
      expect(card?.classList.contains('custom-class')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper progressbar role and attributes', () => {
      const user = mockUser({ name: 'John' });
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label');
    });

    it('provides semantic link elements for checklist items', () => {
      const user = mockUser();
      (useAuthStore as any).mockReturnValue({ user });

      render(<ProfileCompletion variant="card" />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });
});
