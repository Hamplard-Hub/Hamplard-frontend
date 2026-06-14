import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { CourseStatus } from '@/types';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const shortAddress = (a: string, chars = 4) =>
  a ? `${a.slice(0, chars + 1)}...${a.slice(-chars)}` : '';

export const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

/** Convert USDC price (already in human-readable form from backend) to display string */
export const formatUsdc = (price: number | string) =>
  `$${parseFloat(String(price)).toFixed(2)}`;

/** Convert stroops to USDC */
export const stroopsToUsdc = (stroops: string | bigint) => {
  const v = BigInt(stroops);
  return parseFloat(`${v / 10_000_000n}.${(v % 10_000_000n).toString().padStart(7, '0')}`).toFixed(2);
};

/** Convert USDC amount to stroops */
export const usdcToStroops = (usdc: number | string): bigint => {
  const [whole, fraction = ''] = String(usdc).split('.');
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, '0').slice(0, 7));
};

export const formatDate    = (d: string | null) => d ? format(new Date(d), 'MMM d, yyyy') : '—';
export const timeAgo       = (d: string | null) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—';

/** Format seconds into mm:ss or h:mm:ss */
export const formatDuration = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Total duration of all lessons in minutes */
export const courseTotalMins = (totalSecs: number) => Math.ceil(totalSecs / 60);

export const courseStatusBadge = (status: CourseStatus): string => {
  const map: Record<CourseStatus, string> = {
    DRAFT:    'badge-draft',
    PENDING:  'badge-pending',
    ACTIVE:   'badge-active',
    PAUSED:   'badge-paused',
    ARCHIVED: 'badge-archived',
  };
  return map[status] ?? 'badge';
};

export const levelChip = (level: string): string => {
  const map: Record<string, string> = {
    Beginner:     'chip-beginner',
    Intermediate: 'chip-intermediate',
    Advanced:     'chip-advanced',
  };
  return map[level] ?? 'badge';
};

/** Generate a unique course ID */
export const generateCourseId = (category: string) => {
  const slug = category.toUpperCase().replace(/\s+/g, '-').slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `COURSE-${slug}-${rand}`;
};
