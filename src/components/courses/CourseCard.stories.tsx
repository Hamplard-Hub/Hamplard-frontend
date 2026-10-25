import type { Meta, StoryObj } from '@storybook/react';
import { CourseCard } from './CourseCard';
import type { Course } from '@/types';

const mockCourse: Course = {
  id: 'course-1',
  instructorAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  title: 'Advanced React Patterns',
  description: 'Master advanced React concepts including custom hooks, performance optimization, and architectural patterns.',
  instructor: {
    name: 'Sarah Chen',
    stellarAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    avatarUrl: null,
  },
  category: 'Photography',
  level: 'Intermediate',
  language: 'English',
  price: 49.99,
  platformFeePercent: 10,
  originalPrice: 99.99,
  rating: 4.8,
  reviewCount: 1250,
  totalDuration: 1800,
  totalLessons: 24,
  totalEnrollments: 3500,
  totalRevenue: 174965,
  txHash: null,
  approvedAt: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-02T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  status: 'ACTIVE',
  badge: 'bestseller',
  thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=500&h=300&fit=crop',
  previewVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  modules: [],
  _count: { enrollments: 3500 },
} as unknown as Course;

const meta = {
  title: 'Components/CourseCard',
  component: CourseCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    course: mockCourse,
  },
};

export const WithProgress: Story = {
  args: {
    course: mockCourse,
    showProgress: 65,
  },
};

export const NoRating: Story = {
  args: {
    course: {
      ...mockCourse,
      rating: undefined,
      reviewCount: 0,
    },
  },
};

export const NoDiscount: Story = {
  args: {
    course: {
      ...mockCourse,
      originalPrice: undefined,
    },
  },
};

export const NoPreview: Story = {
  args: {
    course: {
      ...mockCourse,
      previewVideoUrl: null,
    },
  },
};

export const HotBadge: Story = {
  args: {
    course: {
      ...mockCourse,
      badge: 'hot',
    },
  },
};

export const NewBadge: Story = {
  args: {
    course: {
      ...mockCourse,
      badge: 'new',
    },
  },
};

export const WithCustomHref: Story = {
  args: {
    course: mockCourse,
    href: '/courses/course-1',
  },
};

export const Beginner: Story = {
  args: {
    course: {
      ...mockCourse,
      level: 'Beginner',
      price: 19.99,
    },
  },
};

export const Advanced: Story = {
  args: {
    course: {
      ...mockCourse,
      level: 'Advanced',
      price: 79.99,
    },
  },
};
