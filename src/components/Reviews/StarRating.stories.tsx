import type { Meta, StoryObj } from '@storybook/react';
import StarRatingSelector from './StarRating';

const meta = {
  title: 'Components/StarRating',
  component: StarRatingSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StarRatingSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
