import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Breadcrumb } from './Breadcrumb';

// next/link renders a plain <a> in the test environment
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// The absoluteUrl helper reads NEXT_PUBLIC_SITE_URL; pin it for deterministic JSON-LD assertions
vi.mock('@/lib/seo', () => ({
  absoluteUrl: (path: string) => `https://hamplard.com${path}`,
}));

const items = [
  { label: 'Home',    href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'JavaScript Masterclass' },
];

describe('Breadcrumb', () => {
  describe('Rendering', () => {
    it('renders all item labels', () => {
      render(<Breadcrumb items={items} />);
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Courses').length).toBeGreaterThan(0);
      expect(screen.getAllByText('JavaScript Masterclass').length).toBeGreaterThan(0);
    });

    it('returns null when items array is empty', () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when items prop is missing', () => {
      // @ts-expect-error — testing missing prop guard
      const { container } = render(<Breadcrumb />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Link rendering', () => {
    it('renders linked items as <a> tags', () => {
      render(<Breadcrumb items={items} />);
      const homeLinks = screen.getAllByRole('link', { name: 'Home' });
      expect(homeLinks.length).toBeGreaterThan(0);
      expect(homeLinks[0]).toHaveAttribute('href', '/');
    });

    it('does NOT render the last item as a link', () => {
      render(<Breadcrumb items={items} />);
      // The last item has no href, so it should not appear as an <a>
      const lastItemLinks = screen.queryAllByRole('link', { name: 'JavaScript Masterclass' });
      expect(lastItemLinks).toHaveLength(0);
    });

    it('renders the last item as plain text', () => {
      render(<Breadcrumb items={items} />);
      const spans = screen.getAllByText('JavaScript Masterclass');
      // At least one match must be a <span> (not an <a>)
      const isSpan = spans.some((el) => el.tagName === 'SPAN');
      expect(isSpan).toBe(true);
    });
  });

  describe('ARIA attributes', () => {
    it('renders a <nav> with aria-label="Breadcrumb" by default', () => {
      render(<Breadcrumb items={items} />);
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('accepts a custom ariaLabel', () => {
      render(<Breadcrumb items={items} ariaLabel="Page location" />);
      expect(screen.getByRole('navigation', { name: 'Page location' })).toBeInTheDocument();
    });

    it('sets aria-current="page" only on the last item', () => {
      render(<Breadcrumb items={items} />);
      const currentItems = screen.queryAllByText('JavaScript Masterclass');
      const withAriaCurrent = currentItems.filter(
        (el) => el.getAttribute('aria-current') === 'page',
      );
      expect(withAriaCurrent.length).toBeGreaterThan(0);
    });

    it('does NOT set aria-current on non-last items', () => {
      render(<Breadcrumb items={items} />);
      const homeItems = screen.getAllByText('Home');
      homeItems.forEach((el) => {
        expect(el).not.toHaveAttribute('aria-current', 'page');
      });
    });
  });

  describe('Separators', () => {
    it('renders chevron separators between items (aria-hidden)', () => {
      const { container } = render(<Breadcrumb items={items} />);
      // ChevronRight renders an <svg aria-hidden="true"> between each pair
      const separators = container.querySelectorAll('svg[aria-hidden="true"]');
      // Each view (mobile + desktop) renders (n-1) separators = 2 each = 4 total
      expect(separators.length).toBeGreaterThanOrEqual(items.length - 1);
    });
  });

  describe('JSON-LD structured data', () => {
    it('emits a <script type="application/ld+json"> tag', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBe(1);
    });

    it('JSON-LD contains BreadcrumbList schema type', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]')!;
      const data = JSON.parse(script.textContent ?? '{}');
      expect(data['@type']).toBe('BreadcrumbList');
      expect(data['@context']).toBe('https://schema.org');
    });

    it('JSON-LD itemListElement has correct positions and names', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]')!;
      const data = JSON.parse(script.textContent ?? '{}');

      expect(data.itemListElement).toHaveLength(3);
      expect(data.itemListElement[0]).toMatchObject({ position: 1, name: 'Home' });
      expect(data.itemListElement[1]).toMatchObject({ position: 2, name: 'Courses' });
      expect(data.itemListElement[2]).toMatchObject({ position: 3, name: 'JavaScript Masterclass' });
    });

    it('JSON-LD uses absolute URLs for linked items', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]')!;
      const data = JSON.parse(script.textContent ?? '{}');

      // Home and Courses have hrefs — they must be absolute
      expect(data.itemListElement[0].item).toBe('https://hamplard.com/');
      expect(data.itemListElement[1].item).toBe('https://hamplard.com/courses');
    });

    it('JSON-LD omits `item` property for the last breadcrumb (no href)', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]')!;
      const data = JSON.parse(script.textContent ?? '{}');
      // Last item has no href so no `item` key
      expect(data.itemListElement[2].item).toBeUndefined();
    });
  });

  describe('Mobile truncation', () => {
    it('shows all items on desktop when count <= 4', () => {
      render(<Breadcrumb items={items} />);
      // Desktop <div class="hidden md:block"> — query by the desktop container
      // Both views render, but we just verify no ellipsis for short lists
      const ellipsis = screen.queryAllByText('…');
      expect(ellipsis).toHaveLength(0);
    });

    it('shows ellipsis on mobile when items exceed threshold', () => {
      const longItems = [
        { label: 'Home',        href: '/'         },
        { label: 'Dashboard',   href: '/dashboard' },
        { label: 'Courses',     href: '/courses'   },
        { label: 'My Course',   href: '/courses/1' },
        { label: 'Learn'                           },
      ];
      render(<Breadcrumb items={longItems} />);
      const ellipsis = screen.getAllByText('…');
      // Mobile list collapses to [first, …, last]
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the nav element', () => {
      const { container } = render(<Breadcrumb items={items} className="my-custom-class" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('my-custom-class');
    });
  });

  describe('Single item', () => {
    it('renders a single item without a separator', () => {
      render(<Breadcrumb items={[{ label: 'Home', href: '/' }]} />);
      const separators = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(separators).toHaveLength(0);
    });
  });
});
