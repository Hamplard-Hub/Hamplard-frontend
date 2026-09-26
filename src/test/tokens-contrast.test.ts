import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function resolveHexValue(css: string, value: string): string {
  if (value.startsWith('#')) {
    return value.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3$/i, '#$1$2$3');
  }

  const match = value.match(/var\(--([a-z0-9-]+)\)/i);
  if (!match) {
    throw new Error(`Unable to resolve CSS value: ${value}`);
  }

  const tokenName = match[1];
  const tokenMatch = css.match(new RegExp(`--${tokenName}:\\s*([^;]+)`));
  if (!tokenMatch) {
    throw new Error(`Token ${tokenName} not found`);
  }

  return resolveHexValue(css, tokenMatch[1].trim());
}

function getHexToken(css: string, token: string): string {
  const match = css.match(new RegExp(`--${token}:\\s*([^;]+)`));
  if (!match) {
    throw new Error(`Token ${token} not found`);
  }
  return resolveHexValue(css, match[1].trim());
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((x) => x + x).join('') : value;
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16) / 255);

  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('design token contrast ratios', () => {
  it('keeps primary purple legible on lilac backgrounds and white readable on primary buttons', () => {
    const css = readFileSync(path.resolve(__dirname, '../styles/tokens.css'), 'utf8');
    const primary = getHexToken(css, 'color-brand-primary');
    const lilac = getHexToken(css, 'color-brand-lilac');
    const onPrimary = getHexToken(css, 'color-text-on-primary');
    const bgPrimary = getHexToken(css, 'color-bg-primary');
    const muted = getHexToken(css, 'color-text-muted');

    expect(contrastRatio(primary, lilac)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(onPrimary, bgPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(muted, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', '#4A42B8')).toBeGreaterThanOrEqual(4.5);
  });
});
