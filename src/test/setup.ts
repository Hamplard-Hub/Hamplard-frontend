import '@testing-library/jest-dom';
import React from 'react';
import { expect, vi } from 'vitest';
import 'vitest-axe/extend-expect';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// jsdom does not run Next's image optimizer. Render next/image as a plain img
// so component tests can keep asserting the original source URL while the
// production code still gets the optimisation, sizing and lazy loading.
type MockImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | { src?: string };
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  quality?: number;
};

vi.mock('next/image', () => ({
  default: ({
    src,
    alt = '',
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    quality: _quality,
    ...props
  }: MockImageProps) => React.createElement('img', {
    ...props,
    src: typeof src === 'string' ? src : src?.src,
    alt,
  }),
}));
