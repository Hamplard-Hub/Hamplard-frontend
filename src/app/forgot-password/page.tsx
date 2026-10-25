'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';
import { authApi } from '@/lib/api/services';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    try {
      await authApi.requestPasswordReset({ email: values.email });
      setIsSubmitted(true);
    } catch (error) {
      // Always show a neutral success message to avoid account enumeration
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#EEEDFE] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
          <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
            Hamplard
          </Link>
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-[#EEEDFE] rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#7F77DD]" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-[#26215C] text-center">Check your email</h1>
          <p className="mb-6 text-sm text-[#554F99] text-center">
            If an account exists with that email, we&apos;ve sent instructions to reset your password.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEEDFE] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-10">
        <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
          Hamplard
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-[#26215C]">Forgot password</h1>
        <p className="mb-6 text-sm text-[#554F99]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <fieldset disabled={isSubmitting} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.email
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                }`}
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
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
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </fieldset>
        </form>

        <p className="mt-6 text-center text-sm text-[#554F99]">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-[#3C3489] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
