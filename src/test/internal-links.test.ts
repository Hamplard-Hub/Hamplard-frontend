import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const appRoot = path.join(projectRoot, 'src', 'app');
const sourceRoots = [appRoot, path.join(projectRoot, 'src', 'components')];

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function routePath(filePath: string): string {
  const relativePath = path.relative(appRoot, path.dirname(filePath));
  const segments = relativePath
    .split(path.sep)
    .filter((segment) => segment && !/^\(.*\)$/.test(segment));
  return segments.length ? `/${segments.join('/')}` : '/';
}

const appRoutes = walk(appRoot)
  .filter((filePath) => /^(page|route)\.(tsx?|jsx?)$/.test(path.basename(filePath)))
  .map(routePath);

// Next.js metadata routes are exposed with file extensions in their URLs.
appRoutes.push('/sitemap.xml', '/robots.txt');

function matchesRoute(hrefPath: string): boolean {
  const target = hrefPath.split('/').filter(Boolean);

  return appRoutes.some((route) => {
    const segments = route.split('/').filter(Boolean);
    let targetIndex = 0;

    for (const segment of segments) {
      if (/^\[\.\.\..+\]$/.test(segment)) return targetIndex < target.length;
      if (/^\[\[\.\.\..+\]\]$/.test(segment)) return true;
      if (targetIndex >= target.length) return false;
      if (!/^\[.+\]$/.test(segment) && segment !== target[targetIndex]) return false;
      targetIndex += 1;
    }

    return targetIndex === target.length;
  });
}

function findUnknownInternalLinks(): string[] {
  return sourceRoots
    .flatMap(walk)
    .filter((filePath) => /\.tsx?$/.test(filePath) && !/(\.test\.|\.stories\.)/.test(filePath))
    .flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      const hrefs = source.matchAll(/href\s*(?:=|:)\s*['"]([^'"]+)['"]/g);

      return [...hrefs].flatMap((match) => {
        const href = match[1];
        if (!href.startsWith('/')) return [];

        const hrefPath = href.split(/[?#]/, 1)[0] || '/';
        const publicPath = path.join(projectRoot, 'public', hrefPath.replace(/^\//, ''));
        if (matchesRoute(hrefPath) || existsSync(publicPath)) return [];

        return [`${path.relative(projectRoot, filePath)} → ${href}`];
      });
    });
}

describe('internal link destinations', () => {
  it('only links to known app routes or public assets', () => {
    expect(findUnknownInternalLinks()).toEqual([]);
  });
});