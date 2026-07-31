'use client';

import { useEffect, useState } from 'react';
import { Bell, Shield, Save, Loader2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailUpdates, setEmailUpdates] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  useEffect(() => {
    // No dedicated settings endpoints found in current client services.
    // Keep this page functional as UI scaffold.
    setLoaded(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Scaffold only (no backend endpoint).
      await new Promise((r) => setTimeout(r, 600));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings' },
          ]}
          className="mb-3"
        />
        <h1 className="section-heading">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Notification and security preferences.</p>
      </div>

      {error && (
        <div className="card p-4 mb-5 border border-red-100 text-red-700 bg-red-50">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-saffron-600" />
            <h2 className="font-semibold text-ink-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={(e) => setEmailUpdates(e.target.checked)}
                className="mt-1"
              />
              <span>
                <p className="text-sm font-medium text-ink-900">Email updates</p>
                <p className="text-xs text-ink-500">Product news and announcements.</p>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={courseUpdates}
                onChange={(e) => setCourseUpdates(e.target.checked)}
                className="mt-1"
              />
              <span>
                <p className="text-sm font-medium text-ink-900">Course updates</p>
                <p className="text-xs text-ink-500">New lessons and reminders.</p>
              </span>
            </label>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-saffron-600" />
            <h2 className="font-semibold text-ink-900">Security</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                className="mt-1"
              />
              <span>
                <p className="text-sm font-medium text-ink-900">Security alerts</p>
                <p className="text-xs text-ink-500">Sign-in and account change alerts.</p>
              </span>
            </label>

            <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
              <p className="text-xs text-ink-500">
                Backend settings endpoints are not wired in this repo yet. This page currently saves locally.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" disabled={saving} onClick={handleSave} className="btn-primary inline-flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>

        <span className="text-xs text-ink-400">
          Preferences will be updated once backend endpoints are available.
        </span>
      </div>
    </div>
  );
}

