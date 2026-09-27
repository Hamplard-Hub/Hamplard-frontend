import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToastContext } from './ToastProvider';
import { Button } from './Button';

function ToastShowcase() {
  const toast = useToastContext();

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-6">Toast Notifications</h2>
      
      <div className="space-y-2">
        <Button
          variant="primary"
          onClick={() =>
            toast.success({
              title: 'Success!',
              description: 'Your changes have been saved successfully.',
            })
          }
        >
          Show Success
        </Button>
        
        <Button
          variant="danger"
          onClick={() =>
            toast.error({
              title: 'Error',
              description: 'Something went wrong. Please try again.',
            })
          }
        >
          Show Error
        </Button>
        
        <Button
          variant="secondary"
          onClick={() =>
            toast.warning({
              title: 'Warning',
              description: 'This action cannot be undone.',
            })
          }
        >
          Show Warning
        </Button>
        
        <Button
          variant="tertiary"
          onClick={() =>
            toast.info({
              title: 'Info',
              description: 'This is an informational message.',
            })
          }
        >
          Show Info
        </Button>
      </div>
    </div>
  );
}

function ToastStackLimitShowcase() {
  const toast = useToastContext();

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-6">Toast Stack Limit</h2>
      <p className="text-sm text-gray-600 mb-4">
        Fires 6 toasts at once. Only 3 render simultaneously; the rest queue in
        order and appear as space frees up. Swipe a toast left or right on a
        touch device to dismiss it.
      </p>

      <Button
        variant="primary"
        onClick={() => {
          for (let i = 1; i <= 6; i += 1) {
            toast.info({
              title: `Queued toast ${i}`,
              description: `Toast ${i} of 6 — extras wait their turn.`,
            });
          }
        }}
      >
        Show 6 Toasts
      </Button>
    </div>
  );
}

const meta = {
  title: 'UI/ToastProvider',
  component: ToastProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastShowcase />
    </ToastProvider>
  ),
};

export const StackLimitAndSwipe: Story = {
  render: () => (
    <ToastProvider>
      <ToastStackLimitShowcase />
    </ToastProvider>
  ),
};
