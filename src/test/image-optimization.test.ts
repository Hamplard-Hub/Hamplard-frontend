import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'test') return [];
      return sourceFiles(fullPath);
    }
    return /\.(tsx|jsx)$/.test(entry.name) && !/\.test\.(tsx|jsx)$/.test(entry.name)
      ? [fullPath]
      : [];
  });
}

const components = sourceFiles(srcRoot).filter((file) => !file.includes(`${path.sep}test${path.sep}`));

describe('next/image migration', () => {
  it('uses next/image instead of raw img elements in production components', () => {
    const offenders = components.filter((file) => /<img\b/.test(readFileSync(file, 'utf8')));

    expect(offenders.map((file) => path.relative(root, file))).toEqual([]);
  });

  it('imports next/image wherever Image is rendered', () => {
    const missingImports = components.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /<Image\b/.test(source) && !/import Image from ['"]next\/image['"]/.test(source);
    });

    expect(missingImports.map((file) => path.relative(root, file))).toEqual([]);
  });

  it('allows configured remote image hosts and keeps the no-img-element lint rule enabled', () => {
    const nextConfig = readFileSync(path.join(root, 'next.config.js'), 'utf8');
    const eslintConfig = JSON.parse(readFileSync(path.join(root, '.eslintrc.json'), 'utf8'));

    expect(nextConfig).toContain('remotePatterns');
    expect(nextConfig).not.toContain('domains:');
    expect(eslintConfig.rules?.['@next/next/no-img-element']).toBeUndefined();
  });
});
