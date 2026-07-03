import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/lib/api/services';

// ─── Mock seed data (used as fallback when the API is unreachable) ─────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock-1',
    type: 'ENROLLMENT_CONFIRMED',
    title: 'Enrollment Confirmed',
    message: 'You have successfully enrolled in "Advanced Tailoring Techniques".',
    data: { courseId: 'demo-course-1' },
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    type: 'COURSE_APPROVED',
    title: 'Course Approved',
    message: 'Your course "Baking Masterclass" has been approved and is now live.',
    data: { courseId: 'demo-course-2' },
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    type: 'CERTIFICATE_ISSUED',
    title: 'Certificate Issued',
    message: 'Congratulations! Your certificate for "Photography Basics" is ready.',
    data: { certificateId: 'cert-001' },
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'mock-4',
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: 'You received $35.00 from a new student enrollment.',
    data: null,
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'mock-5',
    type: 'ASSIGNMENT_SUBMITTED',
    title: 'Assignment Submitted',
    message: 'A student has submitted an assignment for review in "Hairstyling 101".',
    data: null,
    read: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
];

// ─── Store ─────────────────────────────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetched: boolean;

  /** Load from API; fall back to mock data when the API fails. */
  fetchNotifications: () => Promise<void>;

  /** Optimistically mark a single notification as read. */
  markRead: (id: string) => void;

  /** Optimistically mark all notifications as read. */
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  fetched: false,

  fetchNotifications: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await notificationsApi.list();
      // The API returns PaginatedResponse<Notification>; extract the data array.
      const items: Notification[] = Array.isArray(res)
        ? res
        : (res as { data: Notification[] }).data ?? [];
      set({ notifications: items, fetched: true });
    } catch {
      // Backend unavailable in dev — use mock seed so the UI is always testable.
      set({ notifications: MOCK_NOTIFICATIONS, fetched: true });
    } finally {
      set({ loading: false });
    }
  },

  markRead: (id) => {
    notificationsApi.markRead(id).catch(() => null);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  markAllRead: () => {
    notificationsApi.markAllRead().catch(() => null);
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
