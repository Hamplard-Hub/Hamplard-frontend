import type { Meta, StoryObj } from '@storybook/react';
import { CourseCardSkeleton } from './CourseCardSkeleton';

const meta = {
  title: 'Components/CourseCardSkeleton',
  component: CourseCardSkeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseCardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CourseCardSkeleton />
      <CourseCardSkeleton />
      <CourseCardSkeleton />
      <CourseCardSkeleton />
      <CourseCardSkeleton />
      <CourseCardSkeleton />
    </div>
  ),
};
