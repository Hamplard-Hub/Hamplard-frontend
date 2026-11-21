'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Facebook, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      const { accessToken, user } = await authApi.loginWithEmail({
        email: values.email,
        password: values.password,
      });

      const address = user.stellarAddress ?? user.email ?? user.id;
      setAuth(address, accessToken, user, values.rememberMe);

      const callbackUrl = searchParams.get('callbackUrl');
      router.push(callbackUrl ?? '/dashboard');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ??
          error.response?.data?.error ??
          'Invalid email or password. Please try again.';
        setFormError(typeof message === 'string' ? message : 'Login failed. Please try again.');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
        Hamplard
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-[#26215C]">Welcome back</h1>
      <p className="mb-6 text-sm text-[#554F99]">
        Continue your learning journey and pick up where you left off.
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                className={`w-full rounded-xl border px-4 py-2.5 pr-11 text-sm text-[#26215C] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.password
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B66A6] hover:text-[#26215C]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[#26215C]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#B3ADDF] text-[#7F77DD] focus:ring-[#7F77DD] disabled:cursor-not-allowed"
                {...register('rememberMe')}
              />
              Remember me
            </label>
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
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="relative py-2">
            <div className="h-px bg-[#E0DEFA]" />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 bg-white px-3 text-xs font-medium text-[#6B66A6]">
              or continue with
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2.5 text-sm font-medium text-[#26215C] hover:bg-[#EEEDFE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2.5 text-sm font-medium text-[#26215C] hover:bg-[#EEEDFE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Facebook className="h-4 w-4 text-[#1877F2]" />
              Facebook
            </button>
          </div>
        </fieldset>
      </form>

      <p className="mt-6 text-sm text-[#554F99]">
        New to Hamplard?{' '}
        <Link href="/signup" className="font-semibold text-[#3C3489] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="mb-8 h-9 w-32 rounded bg-[#EEEDFE]" />
      <div className="mb-2 h-8 w-48 rounded bg-[#EEEDFE]" />
      <div className="mb-6 h-4 w-full rounded bg-[#EEEDFE]" />
      <div className="space-y-4">
        <div className="h-10 rounded-xl bg-[#EEEDFE]" />
        <div className="h-10 rounded-xl bg-[#EEEDFE]" />
        <div className="h-11 rounded-xl bg-[#EEEDFE]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#EEEDFE] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lg lg:grid-cols-2">
        <section className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </section>

        <section className="order-1 flex min-h-[260px] items-center justify-center bg-gradient-to-br from-[#26215C] to-[#3C3489] p-8 lg:order-2">
          <div className="max-w-sm text-white">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#EEEDFE]">Learn smarter</p>
            <h2 className="mb-4 font-display text-4xl font-bold leading-tight">
              Build practical skills that move your career forward.
            </h2>
            <p className="text-sm leading-relaxed text-[#EEEDFE]">
              Access guided courses, track progress, and earn trusted certificates with Hamplard.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ['10k+', 'Students'],
                ['200+', 'Courses'],
                ['95%', 'Completion'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-white/10 px-3 py-2">
                  <p className="text-base font-semibold">{value}</p>
                  <p className="text-xs text-[#EEEDFE]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
