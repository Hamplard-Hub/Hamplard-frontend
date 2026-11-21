import type { Meta, StoryObj } from '@storybook/react';
import { SocialShare } from './SocialShare';

const meta = {
  title: 'UI/SocialShare',
  component: SocialShare,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['icon', 'label'],
    },
    courseTitle: { control: 'text' },
    thumbnailUrl: { control: 'text' },
  },
} satisfies Meta<typeof SocialShare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    courseTitle: 'Advanced React Patterns',
    url: 'https://hamplard.com/courses/advanced-react-patterns',
    variant: 'label',
    size: 'md',
  },
};

export const WithThumbnail: Story = {
  args: {
    courseTitle: 'Advanced React Patterns',
    url: 'https://hamplard.com/courses/advanced-react-patterns',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=320&h=180&fit=crop',
    variant: 'label',
    size: 'md',
  },
};

export const WithoutThumbnail: Story = {
  name: 'Without Thumbnail (fallback)',
  args: {
    courseTitle: 'Photography Essentials',
    url: 'https://hamplard.com/courses/photography-essentials',
    thumbnailUrl: undefined,
    variant: 'label',
    size: 'md',
  },
};

export const IconOnly: Story = {
  args: {
    courseTitle: 'Advanced React Patterns',
    url: 'https://hamplard.com/courses/advanced-react-patterns',
    variant: 'icon',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    courseTitle: 'Web Design Fundamentals',
    url: 'https://hamplard.com/courses/web-design',
    variant: 'label',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    courseTitle: 'Full-Stack Development',
    url: 'https://hamplard.com/courses/full-stack',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=320&h=180&fit=crop',
    variant: 'label',
    size: 'lg',
  },
};

export const CertificateShare: Story = {
  args: {
    courseTitle: 'Photography Essentials',
    url: 'https://hamplard.com/certificates/cert-12345',
    thumbnailUrl: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=320&h=180&fit=crop',
    variant: 'label',
    size: 'md',
  },
};

export const InlineIcons: Story = {
  args: {
    courseTitle: 'UI/UX Design',
    url: 'https://hamplard.com/courses/ui-ux-design',
    variant: 'icon',
    size: 'lg',
  },
};
