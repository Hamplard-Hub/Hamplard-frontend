'use client';

import { useEffect, useState } from 'react';
import { BellRing, MoonStar, Save } from 'lucide-react';
import { settingsApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';

const CHANNELS = ['inApp', 'email', 'push', 'sms'] as const;
const NOTIFICATION_TYPES = [
  'course_updates',
  'lesson_reminders',
  'announcements',
  'community',
  'security',
] as const;

type Channel = (typeof CHANNELS)[number];
type NotificationType = (typeof NOTIFICATION_TYPES)[number];

type Preferences = Record<NotificationType, Record<Channel, boolean>>;

const EMPTY_PREFERENCES: Preferences = {
  course_updates: { inApp: true, email: true, push: true, sms: false },
  lesson_reminders: { inApp: true, email: true, push: false, sms: false },
  announcements: { inApp: true, email: true, push: true, sms: false },
  community: { inApp: true, email: false, push: false, sms: false },
  security: { inApp: true, email: true, push: true, sms: true },
};

const DEFAULT_QUIET_HOURS = { start: '22:00', end: '07:00' };

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [preferences, setPreferences] = useState<Preferences>(EMPTY_PREFERENCES);
  const [quietHours, setQuietHours] = useState(DEFAULT_QUIET_HOURS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await settingsApi.getNotificationPreferences();
        setPreferences({
          ...EMPTY_PREFERENCES,
          ...saved.preferences,
        });
        if (saved.quietHours) {
          setQuietHours({ ...DEFAULT_QUIET_HOURS, ...saved.quietHours });
        }
      } catch {
        // Fallback to defaults.
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updatePreference = (type: NotificationType, channel: Channel) => {
    setPreferences((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [channel]: !current[type][channel],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveNotificationPreferences({ preferences, quietHours });
      toast.success({
        title: 'Notifications updated',
        description: 'Your delivery preferences have been saved.',
      });
    } catch {
      toast.error({
        title: 'Save failed',
        description: 'Could not update your notification settings right now.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Notification preferences</h1>
        <p className="mt-1 text-sm text-ink-500">Choose which updates you want to receive and where.</p>
      </div>

      {loading ? (
        <div className="card p-8 text-sm text-ink-500">Loading your preferences…</div>
      ) : (
        <>
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-saffron-600" />
              <h2 className="text-lg font-semibold text-ink-900">Delivery channels</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-ink-500">
                    <th className="pb-3 pr-4 font-medium">Notification</th>
                    {CHANNELS.map((channel) => (
                      <th key={channel} className="pb-3 px-3 font-medium capitalize">
                        {channel === 'inApp' ? 'In-app' : channel === 'sms' ? 'WhatsApp / SMS' : channel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_TYPES.map((type) => (
                    <tr key={type} className="border-b border-ink-100 last:border-none">
                      <td className="py-3 pr-4 font-medium text-ink-700 capitalize">
                        {type.replace('_', ' ')}
                      </td>
                      {CHANNELS.map((channel) => (
                        <td key={`${type}-${channel}`} className="px-3 py-3">
                          <label className="flex cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              checked={preferences[type][channel]}
                              onChange={() => updatePreference(type, channel)}
                              className="h-4 w-4 rounded border-ink-200 text-saffron-500 focus:ring-saffron-400"
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <MoonStar className="h-4 w-4 text-saffron-600" />
              <h2 className="text-lg font-semibold text-ink-900">Quiet hours</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-ink-600">
                <span className="mb-1 block">Start</span>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(event) => setQuietHours((current) => ({ ...current, start: event.target.value }))}
                  className="input w-full"
                />
              </label>

              <label className="block text-sm text-ink-600">
                <span className="mb-1 block">End</span>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(event) => setQuietHours((current) => ({ ...current, end: event.target.value }))}
                  className="input w-full"
                />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="button" disabled={saving} onClick={handleSave} className="btn-primary inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
