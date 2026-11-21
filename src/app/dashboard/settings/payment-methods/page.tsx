'use client';

import { useState, useEffect } from 'react';
import { paymentMethodsApi, type SavedPaymentMethod } from '@/lib/api/services';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

/**
 * Payment Methods Settings Page
 * 
 * - Lists saved payment methods with error handling
 * - Properly handles API errors (403, 500) by showing error toast and leaving list unchanged
 * - Falls back to localStorage only on 404 (endpoint not deployed)
 */
export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await paymentMethodsApi.list();
      setMethods(data);
      setToast(null);
    } catch (error) {
      showToast(
        'error',
        'Failed to load payment methods. Please try again.'
      );
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setRemovingId(id);
      await paymentMethodsApi.remove(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      showToast('success', 'Payment method removed successfully');
    } catch (error) {
      showToast(
        'error',
        'Failed to remove payment method. Please try again.'
      );
      console.error('Error removing payment method:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setSettingDefaultId(id);
      await paymentMethodsApi.setDefault(id);
      setMethods((prev) =>
        prev.map((m) => ({
          ...m,
          isDefault: m.id === id,
        }))
      );
      showToast('success', 'Default payment method updated');
    } catch (error) {
      showToast(
        'error',
        'Failed to set default payment method. Please try again.'
      );
      console.error('Error setting default:', error);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
        <p className="mt-2 text-gray-600">
          Manage your saved payment methods securely
        </p>
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

      {/* Payment Methods List */}
      {methods.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No payment methods saved yet</p>
          <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.lastFour}
                  </div>
                  {method.isDefault && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      Default
                    </span>
                  )}
                </div>
                {method.createdAt && (
                  <p className="mt-1 text-sm text-gray-500">
                    Added {new Date(method.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={settingDefaultId === method.id}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {settingDefaultId === method.id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      'Set as Default'
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleRemove(method.id)}
                  disabled={removingId === method.id}
                  className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-200 disabled:opacity-50"
                >
                  {removingId === method.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Method Button */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
          + Add New Payment Method
        </button>
      </div>
    </div>
  );
}
