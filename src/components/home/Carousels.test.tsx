import { fireEvent, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course } from '@/types';
import { CourseCarousel } from './CourseCarousel';
import { TestimonialsCarousel } from './TestimonialsCarousel';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/components/courses/CourseCard', () => ({
  CourseCard: ({ course }: { course: { title: string } }) => <div>{course.title}</div>,
}));

vi.mock('@/components/skeletons', () => ({
  CourseCardSkeleton: () => <div>Loading course</div>,
}));

const originalMatchMedia = window.matchMedia;
const originalScrollTo = HTMLElement.prototype.scrollTo;
const originalScrollBy = HTMLElement.prototype.scrollBy;
let scrollByMock = vi.fn();

function stubMatchMedia(reducedMotion: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const courses: Course[] = [
  {
    id: 'course-1',
    instructorAddress: 'instructor-1',
    title: 'Course One',
    description: null,
    category: 'Design',
    level: 'Beginner',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 0,
    platformFeePercent: 0,
    status: 'ACTIVE',
    totalLessons: 0,
    totalDuration: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    txHash: null,
    approvedAt: null,
    createdAt: '',
    updatedAt: '',
    instructor: { name: 'Instructor' },
    modules: [],
    _count: { enrollments: 0 },
  },
  {
    id: 'course-2',
    instructorAddress: 'instructor-2',
    title: 'Course Two',
    description: null,
    category: 'Design',
    level: 'Beginner',
    language: 'English',
    thumbnailUrl: null,
    previewVideoUrl: null,
    price: 0,
    platformFeePercent: 0,
    status: 'ACTIVE',
    totalLessons: 0,
    totalDuration: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    txHash: null,
    approvedAt: null,
    createdAt: '',
    updatedAt: '',
    instructor: { name: 'Instructor' },
    modules: [],
    _count: { enrollments: 0 },
  },
];

const testimonials = [
  {
    id: 'testimonial-1',
    name: 'Learner One',
    role: 'Designer',
    courseTaken: 'Design Basics',
    quote: 'A helpful course.',
    rating: 5,
  },
  {
    id: 'testimonial-2',
    name: 'Learner Two',
    role: 'Developer',
    courseTaken: 'Web Development',
    quote: 'A useful course.',
    rating: 4,
  },
];

describe('accessible carousels', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    scrollByMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      configurable: true,
      value: scrollByMock,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    if (originalScrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        value: originalScrollTo,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    }
    if (originalScrollBy) {
      Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
        configurable: true,
        value: originalScrollBy,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
    }
    vi.useRealTimers();
  });

  it('exposes course slides and a working pause/resume control', async () => {
    render(
      <CourseCarousel
        title="Featured courses"
        seeAllHref="/courses"
        courses={courses}
        autoplay
      />,
    );

    expect(screen.getByRole('region', { name: 'Featured courses' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    expect(
      screen.getByRole('group', { name: 'Slide 1 of 2: Course One' }),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Pause automatic slide rotation' }));
    expect(
      screen.getByRole('button', { name: 'Resume automatic slide rotation' }),
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(
      screen.getByRole('group', { name: 'Featured courses carousel slides' }),
      { key: 'ArrowRight' },
    );
    expect(scrollByMock).toHaveBeenCalledWith({
      left: 16,
      behavior: 'smooth',
    });
  });

  it('lets users pause and resume testimonial rotation', async () => {
    render(<TestimonialsCarousel testimonials={testimonials} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Pause automatic slide rotation' }));
    expect(
      screen.getByRole('button', { name: 'Resume automatic slide rotation' }),
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(screen.getByRole('group', { name: 'Testimonial slides' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByText('Showing testimonial 2 of 2')).toBeInTheDocument();
  });

  it('provides labeled testimonial slides and stops rotation for reduced motion', () => {
    stubMatchMedia(true);
    vi.useFakeTimers();

    render(
      <TestimonialsCarousel
        testimonials={testimonials}
        autoAdvanceInterval={100}
      />,
    );

    expect(screen.getByRole('region', { name: 'Student testimonials' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    expect(
      screen.getByRole('group', { name: 'Slide 1 of 2: Learner One' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Automatic slide rotation is disabled by your reduced motion preference',
      }),
    ).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('Showing testimonial 1 of 2')).toBeInTheDocument();
  });
});
