import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Heart, Send } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    variant: 'primary',
    children: 'Small',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    variant: 'primary',
    children: 'Medium',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    variant: 'primary',
    children: 'Large',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <Heart className="w-4 h-4" />,
    children: 'Like',
  },
};

export const WithIconRight: Story = {
  args: {
    variant: 'primary',
    icon: <Send className="w-4 h-4" />,
    iconPosition: 'right',
    children: 'Send',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    loadingText: 'Saving...',
    children: 'Submit',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full Width Button',
  },
};
