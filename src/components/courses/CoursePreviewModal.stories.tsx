import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CoursePreviewModal } from './CoursePreviewModal';
import { Button } from '@/components/ui/Button';

function CoursePreviewModalDemo() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Preview Course</Button>
      <CoursePreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        videoUrl="https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4"
        courseTitle="Advanced React Patterns"
        instructorName="Sarah Chen"
      />
    </div>
  );
}

const meta = {
  title: 'Components/CoursePreviewModal',
  component: CoursePreviewModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    courseTitle: {
      control: 'text',
    },
    instructorName: {
      control: 'text',
    },
  },
} satisfies Meta<typeof CoursePreviewModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    courseTitle: 'Advanced React Patterns',
    instructorName: 'Sarah Chen',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    onClose: () => {},
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    courseTitle: 'Advanced React Patterns',
    instructorName: 'Sarah Chen',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    onClose: () => {},
  },
};

export const NoInstructor: Story = {
  args: {
    isOpen: true,
    courseTitle: 'Web Design Fundamentals',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    onClose: () => {},
  },
};

export const Interactive: Story = {
  args: {
    isOpen: true,
    courseTitle: 'Advanced React Patterns',
    instructorName: 'Sarah Chen',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    onClose: () => {},
  },
  render: () => <CoursePreviewModalDemo />,
  parameters: {
    layout: 'fullscreen',
  },
};
