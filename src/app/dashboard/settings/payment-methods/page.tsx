'use client';

import { useEffect, useState } from 'react';
import type { PaymentMethod } from '@stripe/stripe-js';
import { AlertCircle, CreditCard, Plus, Star, Trash2 } from 'lucide-react';
import { AddPaymentMethodModal } from '@/components/checkout/AddPaymentMethodModal';
import { CardBrandIcon, cardBrandLabel } from '@/components/checkout/CardBrandIcon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { paymentMethodsApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SavedPaymentMethod } from '@/types';

type PendingAction = { id: string; kind: 'remove' | 'default' };

const formatExpiry = (method: SavedPaymentMethod) =>
  `${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`;

/** Cards stay valid through the last day of their expiry month. */
const isExpired = (method: SavedPaymentMethod, now = new Date()) =>
  method.expYear < now.getFullYear() ||
  (method.expYear === now.getFullYear() && method.expMonth < now.getMonth() + 1);

/** Default card first, then newest. */
const sortMethods = (methods: SavedPaymentMethod[]) =>
  [...methods].sort(
    (a, b) =>
      Number(b.isDefault) - Number(a.isDefault) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export default function PaymentMethodsPage() {
  const toast = useToast();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<SavedPaymentMethod | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    let cancelled = false;

    paymentMethodsApi
      .list()
      .then((list) => { if (!cancelled) setMethods(sortMethods(list)); })
      .catch(() => { if (!cancelled) setLoadError('We could not load your saved cards. Please refresh to try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const handleAdd = async (paymentMethod: PaymentMethod) => {
    const card = paymentMethod.card;
    if (!card) throw new Error('Only cards can be saved here.');

    const duplicate = methods.some(
      (m) =>
        m.last4 === card.last4 &&
        m.expMonth === card.exp_month &&
        m.expYear === card.exp_year &&
        cardBrandLabel(m.brand) === cardBrandLabel(card.brand),
    );
    if (duplicate) throw new Error('This card is already saved.');

    const saved = await paymentMethodsApi.add({
      id: paymentMethod.id,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
    });

    setMethods((prev) => {
      const next = saved.isDefault ? prev.map((m) => ({ ...m, isDefault: false })) : prev;
      return sortMethods([...next.filter((m) => m.id !== saved.id), saved]);
    });
    setAddOpen(false);
    toast.success({
      title: 'Card saved',
      description: `${cardBrandLabel(saved.brand)} ending in ${saved.last4} is ready for checkout.`,
    });
  };

  const handleSetDefault = async (method: SavedPaymentMethod) => {
    setPending({ id: method.id, kind: 'default' });
    try {
      await paymentMethodsApi.setDefault(method.id);
      setMethods((prev) => sortMethods(prev.map((m) => ({ ...m, isDefault: m.id === method.id }))));
      toast.success({ title: 'Default card updated', description: `${cardBrandLabel(method.brand)} ending in ${method.last4} will be used at checkout.` });
    } catch {
      toast.error({ title: 'Could not update default card', description: 'Please try again.' });
    } finally {
      setPending(null);
    }
  };

  const handleRemove = async () => {
    const method = confirmRemove;
    if (!method) return;

    setPending({ id: method.id, kind: 'remove' });
    try {
      await paymentMethodsApi.remove(method.id);
      setMethods((prev) => prev.filter((m) => m.id !== method.id));
      setConfirmRemove(null);
      toast.success({ title: 'Card removed', description: `${cardBrandLabel(method.brand)} ending in ${method.last4} was removed.` });
      // Removing the default promotes another card server-side; pick that up.
      if (method.isDefault) {
        paymentMethodsApi.list().then((list) => setMethods(sortMethods(list))).catch(() => {});
      }
    } catch {
      toast.error({ title: 'Could not remove card', description: 'Please try again.' });
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings', href: '/dashboard/settings' },
            { label: 'Payment methods' },
          ]}
          className="mb-3"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-heading">Payment methods</h1>
            <p className="text-sm text-ink-500 mt-1">
              Saved cards for faster checkout. Card numbers are stored securely by Stripe, never by Hamplard.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            disabled={loading}
            icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          >
            Add payment method
          </Button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-start gap-3 p-4 mb-5 rounded-lg border border-rose-200 bg-rose-50">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-rose-800">{loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading saved cards">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4 flex items-center gap-4 animate-pulse">
              <div className="h-5 w-8 rounded bg-ink-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-ink-100" />
                <div className="h-3 w-24 rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : methods.length === 0 && !loadError ? (
        <div className="card p-12 text-center">
          <CreditCard className="w-10 h-10 text-ink-200 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-ink-700">No saved cards yet</p>
          <p className="text-xs text-ink-400 mt-1">
            Add a card now and skip typing your details at your next checkout.
          </p>
          <Button
            className="mt-4"
            onClick={() => setAddOpen(true)}
            icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          >
            Add payment method
          </Button>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Saved cards">
          {methods.map((method) => {
            const expired = isExpired(method);
            const busy = pending?.id === method.id;
            const label = `${cardBrandLabel(method.brand)} ending in ${method.last4}`;

            return (
              <li
                key={method.id}
                className={cn(
                  'card p-4 flex flex-wrap items-center gap-4',
                  method.isDefault && 'border-hamplard-primary/40 ring-1 ring-hamplard-primary/20',
                )}
              >
                <CardBrandIcon brand={method.brand} />

                <div className="flex-1 min-w-[10rem]">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                    <span>
                      {cardBrandLabel(method.brand)}{' '}
                      <span className="font-mono tracking-wider">
                        <span aria-hidden="true">•••• </span>
                        <span className="sr-only">ending in </span>
                        {method.last4}
                      </span>
                    </span>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-hamplard-lilac px-2 py-0.5 text-xs font-semibold text-hamplard-deep">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Default
                      </span>
                    )}
                  </p>
                  <p className={cn('text-xs mt-0.5', expired ? 'text-rose-600 font-medium' : 'text-ink-500')}>
                    {expired ? 'Expired' : 'Expires'} {formatExpiry(method)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method)}
                      disabled={pending !== null || expired}
                      isLoading={busy && pending?.kind === 'default'}
                      loadingText="Saving…"
                      aria-label={`Set ${label} as default`}
                      title={expired ? 'Expired cards cannot be the default' : undefined}
                    >
                      Set as default
                    </Button>
                  )}
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => setConfirmRemove(method)}
                    disabled={pending !== null}
                    aria-label={`Remove ${label}`}
                    icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddPaymentMethodModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />

      <ConfirmDialog
        open={confirmRemove !== null}
        destructive
        title="Remove this card?"
        description={
          confirmRemove
            ? `${cardBrandLabel(confirmRemove.brand)} ending in ${confirmRemove.last4} will no longer be available at checkout.` +
              (confirmRemove.isDefault && methods.length > 1 ? ' Your next saved card will become the default.' : '')
            : undefined
        }
        confirmLabel="Remove card"
        loadingText="Removing…"
        isLoading={pending?.kind === 'remove'}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
