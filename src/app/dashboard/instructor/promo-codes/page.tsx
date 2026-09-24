'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { promoCodesApi } from '@/lib/api/services';
import {
  PromoCodeForm,
  formatPromoDiscount,
  type PromoCode,
} from '@/components/instructor/PromoCodeForm';
import { promoCodesCsvFilename, promoCodesToCsv } from '@/components/instructor/promo-codes-csv';
import { Button } from '@/components/ui/Button';
import { formatDate, copyToClipboard } from '@/lib/utils';
import { downloadCsv } from '@/lib/utils/csv';

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await promoCodesApi.getMy();
      setPromoCodes(response.items || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load promo codes.';
      setError(message);
      console.error('Failed to load promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    copyToClipboard(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (promoCodeId: string, currentState: boolean) => {
    try {
      await promoCodesApi.toggleActive(promoCodeId, !currentState);
      setPromoCodes((prev) =>
        prev.map((p) =>
          p.id === promoCodeId ? { ...p, isActive: !p.isActive } : p,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle promo code:', err);
    }
  };

  const handleExportCsv = () => {
    if (promoCodes.length === 0) return;
    downloadCsv(promoCodesCsvFilename(), promoCodesToCsv(promoCodes));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadPromoCodes();
  };

  const activePromoCodes = promoCodes.filter((p) => p.isActive);
  const inactivePromoCodes = promoCodes.filter((p) => !p.isActive);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/instructor"
          className="p-2 hover:bg-ink-50 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-ink-600" />
        </Link>
        <div>
          <h1 className="section-heading">Promo Codes</h1>
          <p className="text-sm text-ink-500 mt-1">Create and manage discount codes for your courses</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200 mb-6">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            {showForm ? (
              <>
                <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
                  Create New Code
                </h2>
                <PromoCodeForm
                  onSuccess={handleFormSuccess}
                  onError={(err) => setError(err)}
                />
                <button
                  onClick={() => setShowForm(false)}
                  className="mt-4 text-sm text-ink-600 hover:text-ink-900 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
                  Quick Actions
                </h2>
                <Button
                  onClick={() => setShowForm(true)}
                  fullWidth
                  className="mb-3"
                >
                  New Promo Code
                </Button>
                <div className="text-xs text-ink-500 space-y-2 pt-4 border-t border-ink-100">
                  <p className="font-medium text-ink-700">💡 Tips:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Use clear, memorable codes</li>
                    <li>Set realistic expiry dates</li>
                    <li>Track usage limits carefully</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Promo Codes List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Your Codes{!loading && promoCodes.length > 0 ? ` (${promoCodes.length})` : ''}
            </h2>
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || promoCodes.length === 0}
              title={promoCodes.length === 0 ? 'Create a promo code to export it' : undefined}
              icon={<Download className="w-4 h-4" aria-hidden="true" />}
            >
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="card p-8 text-center">
              <p className="text-ink-600">Loading promo codes...</p>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="card p-10 text-center">
              <AlertCircle className="w-12 h-12 text-ink-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink-700 mb-1">No promo codes yet</p>
              <p className="text-xs text-ink-500">Create your first promo code to offer discounts on your courses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Codes */}
              {activePromoCodes.length > 0 && (
                <>
                  <h3 className="font-display text-sm font-semibold text-ink-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Active Codes ({activePromoCodes.length})
                  </h3>
                  <div className="space-y-3">
                    {activePromoCodes.map((promo) => (
                      <PromoCodeItem
                        key={promo.id}
                        promo={promo}
                        onCopy={handleCopyCode}
                        onToggleActive={handleToggleActive}
                        isCopied={copiedId === promo.id}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Inactive Codes */}
              {inactivePromoCodes.length > 0 && (
                <>
                  <h3 className="font-display text-sm font-semibold text-ink-900 flex items-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-ink-400 rounded-full" />
                    Inactive Codes ({inactivePromoCodes.length})
                  </h3>
                  <div className="space-y-3">
                    {inactivePromoCodes.map((promo) => (
                      <PromoCodeItem
                        key={promo.id}
                        promo={promo}
                        onCopy={handleCopyCode}
                        onToggleActive={handleToggleActive}
                        isCopied={copiedId === promo.id}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PromoCodeItemProps {
  promo: PromoCode;
  onCopy: (code: string, id: string) => void;
  onToggleActive: (id: string, currentState: boolean) => void;
  isCopied: boolean;
}

function PromoCodeItem({ promo, onCopy, onToggleActive, isCopied }: PromoCodeItemProps) {
  const isExpired = new Date(promo.expiryDate) < new Date();
  const isExhausted = promo.currentUses >= promo.maxUses;
  const discountLabel = formatPromoDiscount(promo);

  return (
    <div className={`card p-4 flex items-start justify-between ${!promo.isActive ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <code className="font-mono font-semibold text-ink-900">{promo.code}</code>
          <button
            onClick={() => onCopy(promo.code, promo.id)}
            className="p-1 hover:bg-ink-100 rounded transition-colors"
            aria-label="Copy code"
          >
            {isCopied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-ink-500" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-ink-500">Discount</p>
            <p className="font-semibold text-ink-900">{discountLabel}</p>
          </div>
          <div>
            <p className="text-ink-500">Uses</p>
            <p className="font-semibold text-ink-900">
              {promo.currentUses}/{promo.maxUses}
            </p>
          </div>
          <div>
            <p className="text-ink-500">Expires</p>
            <p className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-ink-900'}`}>
              {formatDate(promo.expiryDate)}
            </p>
          </div>
          <div>
            <p className="text-ink-500">Status</p>
            <p className={`font-semibold ${promo.isActive ? 'text-emerald-600' : 'text-ink-500'}`}>
              {promo.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <button
          onClick={() => onToggleActive(promo.id, promo.isActive)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            promo.isActive
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {promo.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}
