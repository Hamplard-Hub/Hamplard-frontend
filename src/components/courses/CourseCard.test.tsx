import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CourseCard } from './CourseCard';
import type { Course } from '@/types';

// Mock the wishlist store at top level
const mockToggleWishlistId = vi.fn();

vi.mock('@/lib/hooks/use-wishlist-store', () => ({
  useIsWishlisted: vi.fn(() => false),
  useWishlistStore: vi.fn(() => ({
    toggle: mockToggleWishlistId,
  })),
}));

// Mock next/navigation's useRouter — the hover-prefetch hook calls router.prefetch()
const mockPrefetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt, fill, className, priority }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        data-priority={priority}
      />
    );
  },
}));

// Mock the lib/utils module
vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  courseTotalMins: vi.fn((mins: number) => Math.floor(mins / 60)),
  formatUsdc: vi.fn((price: number) => `$${price.toFixed(2)}`),
  levelChip: vi.fn(() => 'bg-hamplard-lilac text-hamplard-deep px-2 py-1 text-xs rounded'),
}));

const mockCourse: Course = {
  id: 'course-123',
  title: 'Advanced React Patterns and Best Practices for Professional Development',
  description: 'Learn advanced React patterns and best practices for building scalable applications.',
  category: 'Web Development',
  level: 'INTERMEDIATE',
  price: 49.99,
  originalPrice: 99.99,
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  totalDuration: 3600,
  totalLessons: 24,
  rating: 4.5,
  reviewCount: 1250,
  instructor: { id: 'instructor-1', name: 'John Doe', avatarUrl: null },
  status: 'ACTIVE',
  badge: 'bestseller',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// jsdom does not implement window.matchMedia — stub it so the hover-prefetch
// hook can detect pointer devices. Defaults to a fine-pointer (desktop) device.
const originalMatchMedia = window.matchMedia;

function stubMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('CourseCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubMatchMedia(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });

  describe('Thumbnail Rendering', () => {
    it('renders thumbnail image when thumbnailUrl is provided', () => {
      render(<CourseCard course={mockCourse} />);
      const image = screen.getByAltText(`${mockCourse.title} course thumbnail`);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockCourse.thumbnailUrl);
    });

    it('renders placeholder emoji when no thumbnail', () => {
      const courseWithoutThumbnail = { ...mockCourse, thumbnailUrl: null };
      render(<CourseCard course={courseWithoutThumbnail} />);
      expect(screen.getByText('🎓')).toBeInTheDocument();
    });

    it('passes priority prop to image when true', () => {
      render(<CourseCard course={mockCourse} priority={true} />);
      const image = screen.getByAltText(`${mockCourse.title} course thumbnail`);
      expect(image).toHaveAttribute('data-priority', 'true');
    });
  });

  describe('Title Truncation', () => {
    it('title truncates at 2 lines with line-clamp-2', () => {
      render(<CourseCard course={mockCourse} />);
      const title = screen.getByText(mockCourse.title);
      expect(title).toHaveClass('line-clamp-2');
    });

    it('displays the full course title', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
    });
  });

  describe('Wishlist Toggle', () => {
    it('renders wishlist heart button', () => {
      render(<CourseCard course={mockCourse} />);
      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      expect(wishlistButton).toBeInTheDocument();
    });

    it('renders wishlist button with correct aria-label', () => {
      render(<CourseCard course={mockCourse} />);
      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      expect(wishlistButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Badge Display', () => {
    it('displays bestseller badge when badge is bestseller', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/bestseller/i)).toBeInTheDocument();
    });

    it('displays new badge when badge is new', () => {
      const courseWithNewBadge = { ...mockCourse, badge: 'new' as const };
      render(<CourseCard course={courseWithNewBadge} />);
      expect(screen.getByText(/new/i)).toBeInTheDocument();
    });

    it('displays hot badge when badge is hot', () => {
      const courseWithHotBadge = { ...mockCourse, badge: 'hot' as const };
      render(<CourseCard course={courseWithHotBadge} />);
      expect(screen.getByText(/hot/i)).toBeInTheDocument();
    });

    it('shows level chip when no badge is present', () => {
      const courseWithoutBadge = { ...mockCourse, badge: undefined };
      render(<CourseCard course={courseWithoutBadge} />);
      expect(screen.getByText(/intermediate/i)).toBeInTheDocument();
    });
  });

  describe('Pricing Display', () => {
    it('displays formatted price', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/\$49\.99/i)).toBeInTheDocument();
    });

    it('displays original price with strikethrough when discount exists', () => {
      render(<CourseCard course={mockCourse} />);
      const originalPrice = screen.getByText(/\$99\.99/i);
      expect(originalPrice).toHaveClass('line-through');
    });

    it('displays discount percentage', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/-50%/i)).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('displays star rating when rating is present', () => {
      render(<CourseCard course={mockCourse} />);
      // Should have star container with aria-label
      expect(screen.getByLabelText(/4\.5 out of 5 stars/i)).toBeInTheDocument();
    });

    it('displays rating number', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/4\.5/i)).toBeInTheDocument();
    });

    it('displays review count', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/1,250/i)).toBeInTheDocument();
    });
  });

  describe('Link Navigation', () => {
    it('renders as a link', () => {
      render(<CourseCard course={mockCourse} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/dashboard/courses/${mockCourse.id}`);
    });

    it('uses custom href when provided', () => {
      render(<CourseCard course={mockCourse} href="/courses/test-slug" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/courses/test-slug');
    });
  });

  describe('Category Display', () => {
    it('displays course category', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/web development/i)).toBeInTheDocument();
    });
  });

  describe('Instructor Display', () => {
    it('displays instructor name', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('does not show progress bar when showProgress is undefined', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.queryByText(/% complete/i)).not.toBeInTheDocument();
    });

    it('shows progress bar when showProgress is provided', () => {
      render(<CourseCard course={mockCourse} showProgress={45} />);
      expect(screen.getByText(/45% complete/i)).toBeInTheDocument();
    });
  });

  describe('Enroll Button', () => {
    it('shows enroll now badge when status is ACTIVE', () => {
      render(<CourseCard course={mockCourse} />);
      expect(screen.getByText(/enroll now/i)).toBeInTheDocument();
    });
  });

  describe('Hover Prefetching', () => {
    function getCardArticle() {
      const link = screen.getByRole('link');
      return link.querySelector('article') as HTMLElement;
    }

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('prefetches the course page after hovering for 200ms', () => {
      render(<CourseCard course={mockCourse} />);
      const article = getCardArticle();

      fireEvent.mouseEnter(article);
      expect(mockPrefetch).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockPrefetch).toHaveBeenCalledTimes(1);
      expect(mockPrefetch).toHaveBeenCalledWith(`/dashboard/courses/${mockCourse.id}`);
    });

    it('prefetches the custom href when one is provided', () => {
      render(<CourseCard course={mockCourse} href={`/courses/${mockCourse.id}`} />);
      const article = getCardArticle();

      fireEvent.mouseEnter(article);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockPrefetch).toHaveBeenCalledTimes(1);
      expect(mockPrefetch).toHaveBeenCalledWith(`/courses/${mockCourse.id}`);
    });

    it('does not prefetch when the pointer leaves before 200ms', () => {
      render(<CourseCard course={mockCourse} />);
      const article = getCardArticle();

      fireEvent.mouseEnter(article);
      act(() => {
        vi.advanceTimersByTime(150);
      });
      fireEvent.mouseLeave(article);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockPrefetch).not.toHaveBeenCalled();
    });

    it('does not prefetch at all on touch devices', () => {
      stubMatchMedia(false);
      render(<CourseCard course={mockCourse} />);
      const article = getCardArticle();

      fireEvent.mouseEnter(article);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockPrefetch).not.toHaveBeenCalled();
    });

    it('re-arms the prefetch when hovering again after leaving early', () => {
      render(<CourseCard course={mockCourse} />);
      const article = getCardArticle();

      // First hover: leave before the delay elapses.
      fireEvent.mouseEnter(article);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.mouseLeave(article);

      // Second hover: stay past the delay.
      fireEvent.mouseEnter(article);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockPrefetch).toHaveBeenCalledTimes(1);
      expect(mockPrefetch).toHaveBeenCalledWith(`/dashboard/courses/${mockCourse.id}`);
    });
  });
});