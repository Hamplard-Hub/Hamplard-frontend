import type { Meta, StoryObj } from '@storybook/react';
import { CookieConsentBanner } from './CookieConsentBanner';

const meta = {
  title: 'UI/CookieConsentBanner',
  component: CookieConsentBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="bg-white rounded-lg p-8 mb-8">
          <h1 className="text-2xl font-bold mb-4">Page Content</h1>
          <p className="text-gray-600 mb-4">
            This is a demonstration of the Cookie Consent Banner. The banner appears at the bottom of the page.
          </p>
          <p className="text-gray-600">
            The banner will show on page load and allow users to manage their cookie preferences.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CookieConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  decorators: [
    () => {
      // Clear localStorage to ensure banner shows
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hamplard-cookie-consent');
      }
      return <CookieConsentBanner />;
    },
  ],
};
