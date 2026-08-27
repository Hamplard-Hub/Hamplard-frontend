'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Facebook, Mail } from 'lucide-react';

type SignupValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type SignupErrors = Partial<Record<keyof SignupValues, string>>;

export default function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState<SignupValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  const validate = (nextValues: SignupValues) => {
    const nextErrors: SignupErrors = {};
    if (!nextValues.name.trim()) {
      nextErrors.name = 'Full name is required.';
    } else if (nextValues.name.trim().length < 2) {
      nextErrors.name = 'Enter your full name.';
    }
    if (!nextValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!nextValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (nextValues.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (nextValues.password !== nextValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!nextValues.acceptTerms) {
      nextErrors.acceptTerms = 'You must accept the terms to continue.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = validate(values);
    if (!isValid) return;
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.push('/dashboard');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        email: 'Email already registered.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEEDFE] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lg lg:grid-cols-2">
        <section className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-block font-display text-3xl font-bold text-[#26215C]">
              Hamplard
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-[#26215C]">Create your account</h1>
            <p className="mb-6 text-sm text-[#554F99]">
              Join Hamplard and start learning practical, career-ready skills.
            </p>

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={values.name}
                  onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
                  onBlur={() => validate(values)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition ${
                    errors.name ? 'border-red-400 bg-red-50/40' : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                  }`}
                  placeholder="Your full name"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                  onBlur={() => validate(values)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition ${
                    errors.email ? 'border-red-400 bg-red-50/40' : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                  }`}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                  onBlur={() => validate(values)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition ${
                    errors.password ? 'border-red-400 bg-red-50/40' : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                  }`}
                  placeholder="Create a password"
                  aria-invalid={!!errors.password}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={(event) => setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  onBlur={() => validate(values)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50/40' : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                  }`}
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>

              <label className="inline-flex items-start gap-2 text-sm text-[#26215C]">
                <input
                  type="checkbox"
                  checked={values.acceptTerms}
                  onChange={(event) => setValues((prev) => ({ ...prev, acceptTerms: event.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-[#B3ADDF] text-[#7F77DD] focus:ring-[#7F77DD]"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-[#3C3489] hover:underline">
                    terms and privacy policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Signup'}
              </button>

              <div className="relative py-2">
                <div className="h-px bg-[#E0DEFA]" />
                <span className="absolute left-1/2 top-0 -translate-x-1/2 bg-white px-3 text-xs font-medium text-[#6B66A6]">
                  or continue with
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2.5 text-sm font-medium text-[#26215C] hover:bg-[#EEEDFE]">
                  <Mail className="h-4 w-4" />
                  Google
                </button>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-4 py-2.5 text-sm font-medium text-[#26215C] hover:bg-[#EEEDFE]">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </button>
              </div>
            </form>

            {hasErrors && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Please fix the highlighted fields and try again.
              </p>
            )}

            <p className="mt-6 text-sm text-[#554F99]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#3C3489] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </section>

        <section className="order-1 flex min-h-[260px] items-center justify-center bg-gradient-to-br from-[#26215C] to-[#3C3489] p-8 lg:order-2">
          <div className="max-w-sm text-white">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#EEEDFE]">Get started</p>
            <h2 className="mb-4 font-display text-4xl font-bold leading-tight">
              Your future skills start with one account.
            </h2>
            <p className="text-sm leading-relaxed text-[#EEEDFE]">
              Learn from trusted instructors, earn certificates, and grow your confidence with every lesson.
            </p>
            <div className="mt-6 space-y-2 text-sm text-[#EEEDFE]">
              <p className="rounded-lg bg-white/10 px-3 py-2">Structured courses and practical projects</p>
              <p className="rounded-lg bg-white/10 px-3 py-2">Track milestones from beginner to advanced</p>
              <p className="rounded-lg bg-white/10 px-3 py-2">Join a community focused on real-world skills</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
