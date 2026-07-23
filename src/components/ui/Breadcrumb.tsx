import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
}

interface RenderBreadcrumbItem extends BreadcrumbItem {
  originalIndex: number;
  isEllipsis?: boolean;
}

const MOBILE_TRUNCATION_THRESHOLD = 4;

const buildMobileItems = (items: BreadcrumbItem[]): RenderBreadcrumbItem[] => {
  if (items.length <= MOBILE_TRUNCATION_THRESHOLD) {
    return items.map((item, index) => ({ ...item, originalIndex: index }));
  }

  return [
    { ...items[0], originalIndex: 0 },
    { label: '…', originalIndex: -1, isEllipsis: true },
    { ...items[items.length - 1], originalIndex: items.length - 1 },
  ];
};

const toRenderItems = (items: BreadcrumbItem[]): RenderBreadcrumbItem[] =>
  items.map((item, index) => ({ ...item, originalIndex: index }));

const buildSchemaData = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    ...(item.href ? { item: item.href } : {}),
  })),
});

function BreadcrumbList({
  items,
  currentPageIndex,
}: {
  items: RenderBreadcrumbItem[];
  currentPageIndex: number;
}) {
  return (
    <ol className="flex items-center gap-1 text-sm text-ink-500">
      {items.map((item, index) => {
        const isCurrentPage = item.originalIndex === currentPageIndex;
        const shouldRenderLink = !item.isEllipsis && !isCurrentPage && Boolean(item.href);

        return (
          <li key={`${item.label}-${item.originalIndex}-${index}`} className="inline-flex min-w-0 items-center gap-1">
            {shouldRenderLink ? (
              <Link href={item.href as string} className="truncate transition-colors hover:text-hamplard-primary">
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate',
                  isCurrentPage ? 'font-medium text-ink-900' : 'text-ink-500',
                )}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Breadcrumb({
  items,
  className,
  ariaLabel = 'Breadcrumb',
}: BreadcrumbProps) {
  if (!items?.length) {
    return null;
  }

  const desktopItems = toRenderItems(items);
  const mobileItems = buildMobileItems(items);
  const schemaData = buildSchemaData(items);
  const currentPageIndex = items.length - 1;

  return (
    <nav aria-label={ariaLabel} className={cn('w-full', className)}>
      <div className="md:hidden">
        <BreadcrumbList items={mobileItems} currentPageIndex={currentPageIndex} />
      </div>
      <div className="hidden md:block">
        <BreadcrumbList items={desktopItems} currentPageIndex={currentPageIndex} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </nav>
  );
}
