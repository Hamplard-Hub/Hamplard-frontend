'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api/services';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

/**
 * Settings Page with Data Export
 * 
 * - Data export failures now properly surface as errors (fixed issue #551)
 * - User gets error toast with retry option on request failure
 * - Success message only shown on 2xx response
 */
export default function SettingsPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const handleDataExport = async () => {
    try {
      setExportLoading(true);
      const result = await usersApi.requestDataExport();
      showToast('success', result.message);
    } catch (error) {
      showToast(
        'error',
        'Failed to request data export. Please try again or contact support.'
      );
      console.error('Error requesting data export:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and privacy</p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Payment Methods */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Methods
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your saved payment methods and billing information
              </p>
            </div>
            <Link
              href="/dashboard/settings/payment-methods"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Manage
            </Link>
          </div>
        </section>

        {/* Data Export (GDPR) */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Data Export (GDPR)
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Download a copy of all your personal data in a portable format. 
              This includes your profile information, enrollment history, and certificates.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              You will receive an email with a download link within 30 days.
            </p>
          </div>

          <button
            onClick={handleDataExport}
            disabled={exportLoading}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exportLoading && (
              <Loader className="h-4 w-4 animate-spin" />
            )}
            {exportLoading ? 'Requesting...' : 'Request Data Export'}
          </button>

          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
            <p>
              <strong>Important:</strong> If your request fails, you'll see an error message above. 
              Please try again or contact support if the problem persists.
            </p>
          </div>
        </section>

        {/* Account Settings */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Account Settings
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Update your profile, email, and preferences
              </p>
            </div>
            <button className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200">
              Edit Profile
            </button>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Privacy & Security
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your privacy settings and security preferences
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                <span className="text-sm text-gray-700">
                  Allow course recommendations based on your activity
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm text-gray-700">
                  Receive marketing emails
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
            <p className="mt-1 text-sm text-red-800">
              Irreversible actions
            </p>
            <button className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
