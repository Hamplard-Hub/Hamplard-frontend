export const RECENTLY_VIEWED_KEY = 'hamplard_recently_viewed';
export const RECENTLY_VIEWED_LIMIT = 8;
export const RECENTLY_VIEWED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface RecentlyViewedEntry {
  courseId: string;
  viewedAt: string;
}

function readEntries(): RecentlyViewedEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentlyViewedEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentlyViewedEntry).courseId === 'string' &&
        typeof (entry as RecentlyViewedEntry).viewedAt === 'string',
    );
  } catch {
    return [];
  }
}

function writeEntries(entries: RecentlyViewedEntry[]): void {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(entries));
  } catch {
    // Browsing history is best-effort when storage is unavailable.
  }
}

export function getRecentlyViewed(now = Date.now()): RecentlyViewedEntry[] {
  const entries = readEntries();
  const freshEntries = entries
    .filter((entry) => {
      const viewedAt = new Date(entry.viewedAt).getTime();
      return Number.isFinite(viewedAt) && now - viewedAt <= RECENTLY_VIEWED_MAX_AGE_MS;
    })
    .slice(0, RECENTLY_VIEWED_LIMIT);

  if (freshEntries.length !== entries.length) writeEntries(freshEntries);
  return freshEntries;
}

export function recordRecentlyViewed(courseId: string, now = Date.now()): void {
  const entries = getRecentlyViewed(now).filter((entry) => entry.courseId !== courseId);
  writeEntries([
    { courseId, viewedAt: new Date(now).toISOString() },
    ...entries,
  ].slice(0, RECENTLY_VIEWED_LIMIT));
}
