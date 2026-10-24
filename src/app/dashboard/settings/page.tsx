'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Shield,
  Save,
  Loader2,
  Trash2,
  CreditCard,
  ChevronRight,
  Zap,
  Download,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import DeleteAccountModal from '@/components/auth/DeleteAccountModal';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { twoFactorApi, usersApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

export default function SettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(true);

  const [emailUpdates, setEmailUpdates] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { prefersReducedMotion, setManualOverride, clearManualOverride, mounted } = useReducedMotion();
  const [localReducedMotion, setLocalReducedMotion] = useState(false);

  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      try {
        const status = await twoFactorApi.getStatus();
        setTwoFactorEnabled(status.enabled);
      } catch {
        setTwoFactorEnabled(false);
      } finally {
        setLoadingTwoFactor(false);
      }
    };

    // Restore notification preferences from localStorage
    const savedEmailUpdates = localStorage.getItem('settings_emailUpdates');
    const savedCourseUpdates = localStorage.getItem('settings_courseUpdates');
    const savedSecurityAlerts = localStorage.getItem('settings_securityAlerts');
    if (savedEmailUpdates !== null) setEmailUpdates(savedEmailUpdates === 'true');
    if (savedCourseUpdates !== null) setCourseUpdates(savedCourseUpdates === 'true');
    if (savedSecurityAlerts !== null) setSecurityAlerts(savedSecurityAlerts === 'true');

    loadTwoFactorStatus();
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalReducedMotion(prefersReducedMotion);
    }
  }, [mounted, prefersReducedMotion]);

  const handleReducedMotionChange = (enabled: boolean) => {
    setLocalReducedMotion(enabled);
    if (enabled) {
      setManualOverride(true);
      document.documentElement.classList.add('reduce-motion');
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
      clearManualOverride();
      document.documentElement.classList.remove('reduce-motion');
      document.documentElement.removeAttribute('data-reduce-motion');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      // Persist notification preferences
      localStorage.setItem('settings_emailUpdates', String(emailUpdates));
      localStorage.setItem('settings_courseUpdates', String(courseUpdates));
      localStorage.setItem('settings_securityAlerts', String(securityAlerts));
      toast.success({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save settings';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = async () => {
    setExporting(true);
    setExportStatus('Export in progress…');
    setExportError(null);

    try {
      const res = await usersApi.requestDataExport();
      setExportStatus(res.message ?? "Your data export is being prepared, you'll receive an email when ready");
      toast.success({
        title: 'Data Export Requested',
        description: res.message ?? "Your data export is being prepared, you'll receive an email when ready",
        duration: 5000,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to initiate data export. Please try again.';
      setExportError(msg);
      setExportStatus(null);
      toast.error({ title: 'Export Request Failed', description: msg });
    } finally {
      setExporting(false);
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
        <p className="text-sm text-ink-500 mt-1">Notification, accessibility, and security preferences.</p>
      </div>

      {error && (
        <div className="card p-4 mb-5 border border-red-100 text-red-700 bg-red-50">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Notifications Section */}
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

            <Link href="/dashboard/settings/notifications" className="inline-flex items-center gap-2 text-sm font-medium text-saffron-700 hover:text-saffron-800">
              Manage notification channels
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Security Section */}
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

        {/* Accessibility Section */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-saffron-600" aria-hidden="true" />
            <h2 className="font-semibold text-ink-900">Accessibility</h2>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localReducedMotion}
              onChange={(e) => handleReducedMotionChange(e.target.checked)}
              className="mt-1"
            />
            <span>
              <p className="text-sm font-medium text-ink-900">Reduce motion</p>
              <p className="text-xs text-ink-500">Minimise animations and transitions.</p>
            </span>
          </label>
        </section>

        {/* Data Export Section */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-saffron-600" aria-hidden="true" />
            <h2 className="font-semibold text-ink-900">Your data</h2>
          </div>

          <p className="text-sm text-ink-500 mb-4">
            Download a copy of all data associated with your account.
          </p>

          <button
            type="button"
            onClick={handleDataExport}
            disabled={exporting}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
            {exporting ? 'Requesting…' : 'Export my data'}
          </button>

          <div aria-live="polite" aria-atomic="true" className="mt-3 text-sm">
            {exportStatus && !exportError && (
              <p className="text-emerald-700">{exportStatus}</p>
            )}
            {exportError && (
              <p className="text-red-600">{exportError}</p>
            )}
          </div>
        </section>
      </div>

      {/* Two-Factor Authentication Section */}
      <section className="card p-6 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-saffron-600" />
            <h2 className="text-lg font-semibold text-ink-900">Two-Factor Authentication</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            twoFactorEnabled
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="bg-ink-50 p-4 rounded-lg">
          {loadingTwoFactor ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
            </div>
          ) : (
            <TwoFactorSetup />
          )}
        </div>
      </section>

      {/* Payment Methods Section */}
      <Link
        href="/dashboard/settings/payment-methods"
        className="card p-6 mt-5 flex items-center justify-between gap-4 transition-colors hover:bg-ink-50"
      >
        <span className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-saffron-600 mt-0.5" aria-hidden="true" />
          <span>
            <span className="block text-lg font-semibold text-ink-900">Payment methods</span>
            <span className="block text-sm text-ink-500">Add, remove, or choose a default card for checkout.</span>
          </span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-400 shrink-0" aria-hidden="true" />
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" disabled={saving} onClick={handleSave} className="btn-primary inline-flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>

        <span className="text-xs text-ink-400">
          Preferences will be updated once backend endpoints are available.
        </span>
      </div>

      <section className="card mt-8 border-red-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              <h2 className="font-semibold text-ink-900">Danger zone</h2>
            </div>
            <p className="mt-2 max-w-xl text-sm text-ink-500">
              Permanently delete your account, progress, certificates, and course access.
            </p>
          </div>
          <button type="button" onClick={() => setDeleteModalOpen(true)} className="btn-danger shrink-0">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete account
          </button>
        </div>
      </section>

      <DeleteAccountModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
    </div>
  );
}
