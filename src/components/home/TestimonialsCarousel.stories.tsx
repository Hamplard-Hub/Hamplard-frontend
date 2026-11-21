import type { Meta, StoryObj } from '@storybook/react';
import { TestimonialsCarousel } from './TestimonialsCarousel';
import type { Testimonial } from './TestimonialsCarousel';

// Sample testimonials for demo/testing
const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Amina Okafor',
    role: 'Fashion Designer',
    courseTaken: 'Advanced Tailoring Techniques',
    quote: 'The tailoring course completely transformed my business. I went from basic alterations to creating custom wedding dresses. The instructors were patient and the lessons were practical.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Kwame Mensah',
    role: 'Professional Photographer',
    courseTaken: 'Professional Photography Masterclass',
    quote: 'As someone who learned photography on my own, this course filled in all the gaps. The lighting techniques and composition lessons have taken my work to the next level.',
    rating: 5,
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: '3',
    name: 'Fatima Hassan',
    role: 'Pastry Chef',
    courseTaken: 'Professional Baking & Pastry Arts',
    quote: "I started my home bakery after completing this course. The detailed instructions and recipes are amazing. I'm now confident taking custom orders and my business is thriving!",
    rating: 5,
    avatarUrl: 'https://i.pravatar.cc/150?img=45',
  },
  {
    id: '4',
    name: 'David Oluwaseun',
    role: 'Makeup Artist',
    courseTaken: 'Bridal Makeup Artistry',
    quote: 'This course gave me the skills and confidence to start my own makeup business. The techniques I learned have helped me build a strong client base. Highly recommended!',
    rating: 5,
  },
  {
    id: '5',
    name: 'Grace Mwangi',
    role: 'Hair Stylist',
    courseTaken: 'Professional Hairstyling',
    quote: 'The step-by-step tutorials made learning complex hairstyles so easy. I can now offer a wider range of services to my clients and my income has increased significantly.',
    rating: 4,
    avatarUrl: 'https://i.pravatar.cc/150?img=20',
  },
  {
    id: '6',
    name: 'Emmanuel Adeyemi',
    role: 'Nail Technician',
    courseTaken: 'Nail Art & Technology',
    quote: 'From basic manicures to intricate nail art designs, this course covered everything. The hygiene and safety modules were particularly valuable. Worth every penny!',
    rating: 5,
  },
];

const meta: Meta<typeof TestimonialsCarousel> = {
  title: 'Home/TestimonialsCarousel',
  component: TestimonialsCarousel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TestimonialsCarousel>;

/**
 * Default testimonials carousel with 6 sample testimonials.
 * Auto-advances every 5 seconds, pauses on hover.
 */
export const Default: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS,
    autoAdvanceInterval: 5000,
    heading: 'What Our Students Say',
    subtitle: 'Real stories from learners who transformed their skills on Hamplard',
  },
};

/**
 * Carousel with only 3 testimonials (fits perfectly on desktop).
 */
export const ThreeTestimonials: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS.slice(0, 3),
    heading: 'Featured Success Stories',
    subtitle: 'See how our students excel',
  },
};

/**
 * Carousel with fast auto-advance (2 seconds) for demo purposes.
 */
export const FastAutoAdvance: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS,
    autoAdvanceInterval: 2000,
    heading: 'Quick Demo',
    subtitle: 'Fast auto-advance every 2 seconds',
  },
};

/**
 * Carousel with slow auto-advance (10 seconds).
 */
export const SlowAutoAdvance: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS,
    autoAdvanceInterval: 10000,
    heading: 'Slow Motion',
    subtitle: 'Auto-advance every 10 seconds',
  },
};

/**
 * Carousel with custom heading and subtitle.
 */
export const CustomHeading: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS,
    heading: '🌟 Success Stories',
    subtitle: 'Join thousands of students who achieved their dreams',
  },
};

/**
 * Minimal carousel with only 2 testimonials.
 */
export const TwoTestimonials: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS.slice(0, 2),
    heading: 'Recent Reviews',
  },
};

/**
 * Carousel with all initials avatars (no images).
 */
export const InitialsOnly: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS.map((t) => ({ ...t, avatarUrl: null })),
    heading: 'Student Testimonials',
    subtitle: 'Initials avatar fallback demonstration',
  },
};

/**
 * Carousel with mixed ratings (not all 5 stars).
 */
export const MixedRatings: Story = {
  args: {
    testimonials: SAMPLE_TESTIMONIALS.map((t, idx) => ({
      ...t,
      rating: idx % 2 === 0 ? 5 : 4,
    })),
    heading: 'All Reviews',
    subtitle: 'Including 4 and 5 star testimonials',
  },
};

/**
 * Empty state (no testimonials).
 * Component should handle this gracefully by rendering nothing.
 */
export const NoTestimonials: Story = {
  args: {
    testimonials: [],
    heading: 'No Testimonials Yet',
  },
};

/**
 * Single testimonial (no carousel needed).
 */
export const SingleTestimonial: Story = {
  args: {
    testimonials: [SAMPLE_TESTIMONIALS[0]],
    heading: 'Featured Testimonial',
  },
};
