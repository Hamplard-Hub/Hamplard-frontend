# Technical Design - Notification System and Dropdown

## Overview

A comprehensive notification system for Hamplard featuring a bell icon with badge in the navbar, a dropdown notification panel, and a dedicated full-page notifications view. Supports multiple notification types with read/unread states, grouping by date, and mobile-responsive UI.

---

## Routes and Pages

```
/notifications                   → src/app/dashboard/notifications/page.tsx
```

The notification bell dropdown is a persistent component in the top navigation bar on all authenticated pages.

---

## Data Types

```ts
export interface Notification {
  id: string;
  type: 'course_update' | 'new_message' | 'purchase_confirmed' | 'review_received' | 'certificate_earned';
  title: string;
  message: string;
  data: {
    courseId?: string;
    courseName?: string;
    messageId?: string;
    senderName?: string;
    senderAvatar?: string;
    reviewRating?: number;
    certificateName?: string;
  } | null;
  read: boolean;
  avatar?: string;         // sender's avatar for messages
  timestamp: string;       // ISO 8601
  createdAt: string;       // same as timestamp
  actionUrl?: string;      // link to navigate to (course, message thread, etc)
}

interface NotificationGroup {
  date: 'Today' | 'Earlier';
  notifications: Notification[];
}

interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}
```

---

## Notification Types

| Type | Icon | Color | Trigger | Example Message |
|---|---|---|---|---|
| **Course Update** | 📚 | blue | Instructor updates course content | "New video added to 'React Fundamentals'" |
| **New Message** | 💬 | purple | User receives message | "John Doe sent you a message" |
| **Purchase Confirmed** | ✅ | green | Enrollment successful | "Your purchase of 'Web Design 101' is confirmed" |
| **Review Received** | ⭐ | orange | Student reviews course (instructor only) | "Alice reviewed your course: 5 stars" |
| **Certificate Earned** | 🏆 | gold | Student completes course | "Congratulations! You earned a certificate" |

---

## Bell Icon States

### Badge States

```
Unread Count:  Badge Display:
0              (no badge)
1-9            [1] [2] [3] ... [9]
10+            [9+]
```

### Visual States

```tsx
// No unread
<Bell className="w-5 h-5 text-ink-600" />

// Has unread (1-9)
<div className="relative">
  <Bell className="w-5 h-5 text-ink-600" />
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
    3
  </span>
</div>

// Has unread (10+)
<div className="relative">
  <Bell className="w-5 h-5 text-ink-600" />
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
    9+
  </span>
</div>
```

---

## Notification Dropdown

### Desktop Layout (1024px+)

```
┌─ Top Nav ────────────────────────────────────┐
│ [Logo] [Nav] ... [🔔 3] [Account ▼]         │
│                   └─┐ (click to open)        │
│                     │                        │
│                  ┌──▼──────────────────────┐ │
│                  │ Notifications      🔔   │ │
│                  ├────────────────────────┤ │
│                  │                        │ │
│                  │ Today                  │ │
│                  │ ┌──────────────────┐  │ │
│                  │ │ 📚 (unread bg)   │  │ │
│                  │ │ Course Update    │  │ │
│                  │ │ New video in...  │  │ │
│                  │ │ 2 hours ago      │  │ │
│                  │ └──────────────────┘  │ │
│                  │ ┌──────────────────┐  │ │
│                  │ │ ✅ (read bg)     │  │ │
│                  │ │ Purchase OK      │  │ │
│                  │ │ Your order conf. │  │ │
│                  │ │ 5 hours ago      │  │ │
│                  │ └──────────────────┘  │ │
│                  │                        │ │
│                  │ Earlier                │ │
│                  │ ┌──────────────────┐  │ │
│                  │ │ 💬 (unread bg)   │  │ │
│                  │ │ New Message      │  │ │
│                  │ │ John Doe sent... │  │ │
│                  │ │ Jun 25           │  │ │
│                  │ └──────────────────┘  │ │
│                  │                        │ │
│                  │ ┌──────────────────┐  │ │
│                  │ │ [Mark All Read]  │  │ │
│                  │ │ [View All]       │  │ │
│                  │ └──────────────────┘  │ │
│                  │                        │ │
│                  └────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Tablet Layout (768px)

- Dropdown width: 400px (slightly narrower)
- Same structure as desktop
- More padding on sides

### Mobile Layout (375px)

- On mobile, clicking the bell opens the full notifications page instead of a dropdown
- See "Notifications Page" section below

---

## Notification Item Structure

### Unread State (Light background)

```
┌────────────────────────────────┐
│ [Avatar]  📚 Course Update     │
│ 32x32px   "New video added..." │
│ or Icon   2 hours ago          │
│           ↳ Navigate to course│
└────────────────────────────────┘
```

### Read State (Standard background)

```
┌────────────────────────────────┐
│ [Avatar]  ✅ Purchase Complete │
│ 32x32px   "Your order conf..." │
│ or Icon   5 hours ago          │
└────────────────────────────────┘
```

### Components

#### NotificationBell (in TopBar)

```ts
interface NotificationBellProps {
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (url: string) => void;
  isMobile: boolean;
}

export function NotificationBell({
  unreadCount,
  isOpen,
  onToggle,
  onNavigate,
  isMobile,
}: NotificationBellProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 text-ink-600 hover:text-ink-900 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && !isMobile && (
        <NotificationDropdown onNavigate={onNavigate} />
      )}
    </div>
  );
}
```

#### NotificationDropdown

```ts
interface NotificationDropdownProps {
  onNavigate: (url: string) => void;
}

export function NotificationDropdown({ onNavigate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await notificationsApi.list();
        setNotifications(response.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = groupNotificationsByDate(notifications);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    // Refetch or update state
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-bold text-lg">Notifications</h3>
        <Bell className="w-5 h-5 text-ink-600" />
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4 text-center text-ink-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-ink-500">
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, notifs]) => (
            <div key={date}>
              <div className="px-4 py-2 text-xs font-bold text-ink-600 bg-neutral-50 sticky top-0">
                {date}
              </div>
              {notifs.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && (
        <div className="border-t p-3 space-y-2">
          <button
            onClick={handleMarkAllRead}
            className="w-full text-center text-sm text-saffron-600 hover:text-saffron-700 font-semibold py-2"
          >
            Mark all as read
          </button>
          <button
            onClick={() => onNavigate('/notifications')}
            className="w-full text-center text-sm text-saffron-600 hover:text-saffron-700 font-semibold py-2 border-t"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

function groupNotificationsByDate(
  notifications: Notification[]
): Record<string, Notification[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return notifications.reduce(
    (acc, notif) => {
      const notifDate = new Date(notif.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      const date = notifDate.getTime() === today.getTime() ? 'Today' : 'Earlier';
      if (!acc[date]) acc[date] = [];
      acc[date].push(notif);
      return acc;
    },
    {} as Record<string, Notification[]>
  );
}
```

#### NotificationItem

```ts
interface NotificationItemProps {
  notification: Notification;
  onNavigate: (url: string) => void;
}

export function NotificationItem({
  notification,
  onNavigate,
}: NotificationItemProps) {
  const { icon, color, label } = getNotificationMeta(notification.type);

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.read) {
      await notificationsApi.markRead(notification.id);
    }
    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      onNavigate(notification.actionUrl);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-neutral-50 transition ${
        !notification.read ? 'bg-saffron-50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar or Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span>{icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-ink-900 truncate">
              {label}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-saffron-600 flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-ink-600 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-ink-500 mt-1">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function getNotificationMeta(type: Notification['type']) {
  const map: Record<
    Notification['type'],
    { icon: string; color: string; label: string }
  > = {
    course_update: { icon: '📚', color: 'blue', label: 'Course Update' },
    new_message: { icon: '💬', color: 'purple', label: 'New Message' },
    purchase_confirmed: {
      icon: '✅',
      color: 'green',
      label: 'Purchase Confirmed',
    },
    review_received: { icon: '⭐', color: 'orange', label: 'Review Received' },
    certificate_earned: {
      icon: '🏆',
      color: 'gold',
      label: 'Certificate Earned',
    },
  };
  return map[type];
}

function formatTimeAgo(timestamp: string): string {
  // Return human-readable time like "2 hours ago", "1 day ago"
}
```

---

## Full Notifications Page (`/notifications`)

### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────┐
│ [Nav]                                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Notifications                                      │
│                                                     │
│  [All] [Unread ▼] [Archive ▼]     [Mark All Read]  │
│  [Sort: Newest ▼]                                   │
│                                                     │
│  Today                                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Avatar] 📚 Course Update           [×]       │ │
│  │ New video added to "React Fund..."           │ │
│  │ 2 hours ago                  [Mark Unread]   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Avatar] ✅ Purchase Confirmed       [×]      │ │
│  │ Your purchase of "Web Design 101" conf...    │ │
│  │ 5 hours ago                                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Yesterday                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Avatar] 💬 New Message              [×]      │ │
│  │ John Doe: "Hey, can you review my p..."      │ │
│  │ Jun 26                                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Pagination: 1 2 3 >]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (375px)

```
┌──────────────────────────────────┐
│ ☰ Notifications             [×]  │
├──────────────────────────────────┤
│                                  │
│ [All] [Unread] [Archive]        │
│ [Sort ▼] [Mark All ✓]          │
│                                  │
│ Today                            │
│ ┌──────────────────────────────┐ │
│ │ 📚 Course Update     [×]     │ │
│ │ New video added...           │ │
│ │ 2 hours ago                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ✅ Purchase Confirmed [×]    │ │
│ │ Your order conf...           │ │
│ │ 5 hours ago                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ Yesterday                        │
│ ┌──────────────────────────────┐ │
│ │ 💬 New Message       [×]     │ │
│ │ John Doe sent...             │ │
│ │ Jun 26                       │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Load More]                      │
│                                  │
├──────────────────────────────────┤
│ [Bottom Nav]                     │
└──────────────────────────────────┘
```

### NotificationsPage Component

```ts
'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api/services';
import type { Notification } from '@/types';

type Filter = 'all' | 'unread' | 'archived';
type Sort = 'newest' | 'oldest';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const response = await notificationsApi.list({
          unreadOnly: filter === 'unread',
        });
        setNotifications(response.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sort === 'newest' ? bDate - aDate : aDate - bDate;
  });

  const grouped = groupByDate(sorted);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleMarkAsRead = async (id: string, read: boolean) => {
    if (read) {
      // already read, toggle to unread? (optional)
    } else {
      await notificationsApi.markRead(id);
      setNotifications(
        notifications.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${
              filter === 'all' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`btn btn-sm ${
              filter === 'unread' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="input flex-1 md:flex-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-ink-500">
          <p className="text-lg">No notifications</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, notifs]) => (
            <div key={date}>
              <h2 className="font-bold text-sm text-ink-600 mb-4 uppercase">
                {date}
              </h2>
              <div className="space-y-2">
                {notifs.map(notif => (
                  <NotificationItemFull
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={() =>
                      handleMarkAsRead(notif.id, notif.read)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface NotificationItemFullProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

function NotificationItemFull({
  notification,
  onMarkAsRead,
}: NotificationItemFullProps) {
  const { icon, color } = getNotificationMeta(notification.type);

  return (
    <div
      className={`p-4 rounded-lg border flex gap-4 items-start ${
        !notification.read
          ? 'bg-saffron-50 border-saffron-200'
          : 'bg-white border-neutral-200'
      }`}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-neutral-100">
        {notification.avatar ? (
          <img
            src={notification.avatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          icon
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold text-ink-900">
          {notification.title}
        </h3>
        <p className="text-ink-600 text-sm mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-ink-500 mt-2">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!notification.read && (
          <button
            onClick={onMarkAsRead}
            className="text-xs text-saffron-600 hover:text-saffron-700 font-semibold py-1 px-2 hover:bg-saffron-100 rounded"
          >
            Mark read
          </button>
        )}
        <button className="text-xl text-ink-400 hover:text-ink-600">
          ×
        </button>
      </div>
    </div>
  );
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return notifications.reduce(
    (acc, notif) => {
      const notifDate = new Date(notif.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      let dateLabel = 'Earlier';
      if (notifDate.getTime() === today.getTime()) {
        dateLabel = 'Today';
      } else if (notifDate.getTime() === yesterday.getTime()) {
        dateLabel = 'Yesterday';
      }

      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(notif);
      return acc;
    },
    {} as Record<string, Notification[]>
  );
}

function getNotificationMeta(type: Notification['type']) {
  const map: Record<
    Notification['type'],
    { icon: string; color: string }
  > = {
    course_update: { icon: '📚', color: 'blue' },
    new_message: { icon: '💬', color: 'purple' },
    purchase_confirmed: { icon: '✅', color: 'green' },
    review_received: { icon: '⭐', color: 'orange' },
    certificate_earned: { icon: '🏆', color: 'gold' },
  };
  return map[type];
}

function formatTimeAgo(timestamp: string): string {
  // Helper to format relative time
}
```

---

## Mobile-Specific Behavior

### Bell Icon on Mobile

When screen size < 1024px and user clicks the bell:
- Close any open dropdowns
- Navigate to `/notifications` page instead of showing dropdown
- Full-page notifications list loads

### Toast Notifications (Optional Enhancement)

For real-time notifications (WebSocket or polling):

```tsx
interface Toast {
  id: string;
  message: string;
  type: Notification['type'];
  duration?: number; // ms, default 5000
}

export function NotificationToast({ notification, onDismiss }: {
  notification: Toast;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 max-w-xs bg-white rounded-lg shadow-lg p-4 border-l-4 border-saffron-600 animate-in slide-in-from-right">
      <div className="flex gap-3">
        <span className="text-xl">{getIcon(notification.type)}</span>
        <div>
          <p className="font-semibold text-sm">{notification.message}</p>
        </div>
        <button onClick={onDismiss} className="text-ink-400">×</button>
      </div>
    </div>
  );
}
```

---

## WebSocket/Real-Time Updates (Future)

When implementing real-time notifications:

```ts
const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  // Update in-memory state
  setNotifications(prev => [notification, ...prev]);
  
  // Update unread count in bell icon
  setUnreadCount(prev => prev + 1);
  
  // Show toast (optional)
  showToast(notification);
};

ws.onerror = () => {
  // Fall back to polling
  pollNotifications();
};
```

---

## API Integration

### Endpoints

```ts
notificationsApi.list(params?: { unreadOnly?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<Notification>>
notificationsApi.markRead(id: string): Promise<void>
notificationsApi.markAllRead(): Promise<void>
notificationsApi.delete(id: string): Promise<void>
```

### Backend Response Format

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "notif-123",
        "type": "course_update",
        "title": "Course Updated",
        "message": "New video added to React Fundamentals",
        "data": {
          "courseId": "course-456",
          "courseName": "React Fundamentals"
        },
        "read": false,
        "avatar": "https://...",
        "createdAt": "2026-06-29T14:30:00Z"
      }
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  },
  "timestamp": "2026-06-29T14:35:00Z"
}
```

---

## File Structure

```
src/
  app/
    dashboard/
      notifications/
        page.tsx                     ← Full notifications page
  components/
    notifications/
      NotificationBell.tsx
      NotificationDropdown.tsx
      NotificationItem.tsx
      NotificationItemFull.tsx
      NotificationsPage.tsx
  lib/
    hooks/
      useNotifications.ts            ← Custom hook for notifications state/polling
```

---

## Custom Hook: useNotifications

```ts
// src/lib/hooks/useNotifications.ts

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await notificationsApi.list();
        setNotifications(response.data);
        const count = response.data.filter(n => !n.read).length;
        setUnreadCount(count);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Poll every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(n => n.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
```

---

## State Management

Use React Context for global notification state:

```ts
// src/lib/context/NotificationContext.tsx

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
```

---

## No New Dependencies

All functionality implemented using:
- React hooks: `useState`, `useEffect`, `useContext`, `useCallback`
- Next.js routing: `useRouter`
- Existing API: `notificationsApi`
- Tailwind CSS utility classes
- `lucide-react` for Bell icon
- Native Web APIs: `Date`, `setInterval`
