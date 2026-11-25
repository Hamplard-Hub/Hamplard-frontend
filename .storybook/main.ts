import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.tsx'],
  addons: ['@storybook/addon-links'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};

export default config;
