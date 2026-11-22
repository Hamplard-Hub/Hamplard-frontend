import { describe, expect, it } from 'vitest';
import { getSafeCallbackUrl, safeRedirectPath } from './safe-redirect';

const ORIGIN = 'https://hamplard.example';

describe('getSafeCallbackUrl', () => {
  it('returns the fallback for null and undefined', () => {
    expect(getSafeCallbackUrl(null, '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl(undefined, '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns the fallback for empty and whitespace-only values', () => {
    expect(getSafeCallbackUrl('', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('   ', '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns the fallback for absolute external URLs', () => {
    expect(getSafeCallbackUrl('https://evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('http://evil.example/phish', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('javascript:alert(1)', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('data:text/html,evil', '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns the fallback for protocol-relative URLs', () => {
    expect(getSafeCallbackUrl('//evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('//evil.example/phish', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('///evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns the fallback for backslash variants', () => {
    expect(getSafeCallbackUrl('/\\evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('/\\\\evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('\\evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('\\\\evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('/dashboard\\@evil.example', '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns the fallback for relative paths without a leading slash', () => {
    expect(getSafeCallbackUrl('dashboard', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('../admin', '/dashboard', ORIGIN)).toBe('/dashboard');
  });

  it('returns same-origin absolute paths unchanged', () => {
    expect(getSafeCallbackUrl('/dashboard', '/dashboard', ORIGIN)).toBe('/dashboard');
    expect(getSafeCallbackUrl('/dashboard/courses/123', '/dashboard', ORIGIN)).toBe('/dashboard/courses/123');
    expect(getSafeCallbackUrl('/dashboard/courses/1/learn', '/dashboard', ORIGIN)).toBe('/dashboard/courses/1/learn');
  });

  it('works safely when base origin is omitted (SSR / Node fallback)', () => {
    expect(getSafeCallbackUrl('/dashboard/courses/1/learn')).toBe('/dashboard/courses/1/learn');
    expect(getSafeCallbackUrl('https://evil.example')).toBe('/dashboard');
  });

  it('preserves query and hash on valid paths', () => {
    expect(getSafeCallbackUrl('/dashboard?tab=1#top', '/dashboard', ORIGIN)).toBe('/dashboard?tab=1#top');
  });

  it('honours a custom fallback', () => {
    expect(getSafeCallbackUrl('https://evil.example', '/home', ORIGIN)).toBe('/home');
  });

  it('provides safeRedirectPath as an identical alias', () => {
    expect(safeRedirectPath('/dashboard/courses/1/learn')).toBe('/dashboard/courses/1/learn');
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard');
  });
});
