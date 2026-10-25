'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api/services';
import { useToastContext } from '@/components/ui/ToastProvider';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToastContext();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const strength = useMemo(() => {
    const pwd = (watch?.('password') as string) || '';
    return getPasswordStrength(pwd);
  }, [/* we need to watch */]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const password = watch('password') || '';
  const currentStrength = getPasswordStrength(password);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError(null);
    if (!token) {
      setFormError('Invalid or missing reset token.');
      return;
    }
    try {
      await authApi.resetPassword({ token, password: values.password });
      setIsSuccess(true);
      toast.success({
        title: 'Password reset successful',
        description: 'You can now log in with your new password.',
      });
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      setFormError('This reset link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
        <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
          Hamplard
        </Link>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Invalid reset link</h1>
        <p className="mb-6 text-sm text-[#554F99] text-center">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
        <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
          Hamplard
        </Link>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Password reset successful</h1>
        <p className="mb-6 text-sm text-[#554F99] text-center">
          Redirecting you to login...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
      <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
        Hamplard
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-[#26215C]">Set new password</h1>
      <p className="mb-6 text-sm text-[#554F99]">
        Create a strong password for your account.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              aria-invalid={!!errors.password}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                errors.password
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-[#D3D0F2] focus:border-[#7F77DD]'
              }`}
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        currentStrength >= level ? 'bg-[#7F77DD]' : 'bg-[#E0DEFA]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6B66A6]">Password strength</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              aria-invalid={!!errors.confirmPassword}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                errors.confirmPassword
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-[#D3D0F2] focus:border-[#7F77DD]'
              }`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#EEEDFE] flex items-center justify-center p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#7F77DD]" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
