'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

type DeleteAccountFormValues = {
  understood: boolean;
  password: string;
};

type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

const consequences = [
  'All course progress and enrolled course access will be permanently removed.',
  'Your certificates and learning history will be deleted.',
  'Any pending refunds or account-related claims may no longer be available.',
];

export default function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormValues>({
    defaultValues: { understood: false, password: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setFormError(null);
      setSecondsRemaining(5);
      reset({ understood: false, password: '' });
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || step !== 3) return;

    const countdown = window.setInterval(() => {
      setSecondsRemaining((value) => Math.max(value - 1, 0));
    }, 1000);
    const redirect = window.setTimeout(() => router.replace('/'), 5000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, [open, router, step]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && step !== 3) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, step]);

  if (!open) return null;

  const goToPasswordStep = async () => {
    setFormError(null);
    if (await trigger('understood')) setStep(2);
  };

  const submitPassword = async ({ password }: DeleteAccountFormValues) => {
    setFormError(null);

    try {
      await deleteAccount(password);
      setStep(3);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.response?.data?.error;
      setFormError(typeof message === 'string' ? message : 'We could not delete your account. Check your password and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close account deletion dialog"
        onClick={step === 3 ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        {step !== 3 && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {step === 3 ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
              <Check className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id="delete-account-title" className="mt-5 font-display text-2xl font-semibold text-ink-900">
              Your account has been deleted
            </h2>
            <p id="delete-account-description" className="mt-2 text-sm text-ink-500">
              Your enrolled course access has been revoked. You will be redirected to the homepage in {secondsRemaining} seconds.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submitPassword)} noValidate>
            <div className="mb-6 flex items-start gap-3 pr-8">
              <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Step {step} of 2</p>
                <h2 id="delete-account-title" className="mt-1 font-display text-2xl font-semibold text-ink-900">
                  {step === 1 ? 'Delete your account?' : 'Confirm your identity'}
                </h2>
              </div>
            </div>

            {step === 1 ? (
              <>
                <p id="delete-account-description" className="text-sm leading-6 text-ink-600">
                  This action is permanent. Once your account is deleted, it cannot be restored.
                </p>
                <ul className="mt-5 space-y-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-ink-700">
                  {consequences.map((consequence) => (
                    <li key={consequence} className="flex gap-3">
                      <span className="mt-0.5 text-red-600" aria-hidden="true">•</span>
                      <span>{consequence}</span>
                    </li>
                  ))}
                </ul>
                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-red-600 focus:ring-red-500"
                    {...register('understood', { required: 'Please confirm that you understand.' })}
                  />
                  <span>I understand that deleting my account is permanent.</span>
                </label>
                {errors.understood && <p className="mt-2 text-xs text-red-600" role="alert">{errors.understood.message}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                  <button type="button" onClick={goToPasswordStep} className="btn-danger">Continue</button>
                </div>
              </>
            ) : (
              <>
                <p id="delete-account-description" className="text-sm leading-6 text-ink-600">
                  Enter your current password to verify your identity before we permanently delete your account.
                </p>
                <label htmlFor="delete-account-password" className="label mt-5">Current password</label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  aria-invalid={!!errors.password}
                  {...register('password', { required: 'Current password is required.' })}
                />
                {errors.password && <p className="mt-2 text-xs text-red-600" role="alert">{errors.password.message}</p>}
                {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{formError}</p>}
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => { setFormError(null); setStep(1); }} className="btn-secondary">Back</button>
                  <button type="submit" disabled={isSubmitting} className="btn-danger">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Deleting...</> : 'Delete account'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
