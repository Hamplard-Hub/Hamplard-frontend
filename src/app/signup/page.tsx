'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Facebook, Mail } from 'lucide-react';
import { FieldError, FormField, Input } from '@/components/ui/form';

type SignupValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type SignupErrors = Partial<Record<keyof SignupValues, string>>;

// Field order used to focus the first invalid field and to order the summary.
const FIELD_ORDER: Array<{ name: keyof SignupValues; label: string }> = [
  { name: 'name', label: 'Full name' },
  { name: 'email', label: 'Email' },
  { name: 'password', label: 'Password' },
  { name: 'confirmPassword', label: 'Confirm Password' },
  { name: 'acceptTerms', label: 'Terms' },
];

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
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
    return nextErrors;
  };

  const focusField = (name: keyof SignupValues) => {
    document.getElementById(name)?.focus();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validate(values);
    const firstInvalid = FIELD_ORDER.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      focusField(firstInvalid.name);
      return;
    }
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
              {submitAttempted && hasErrors && (
                <div
                  role="alert"
                  aria-labelledby="signup-error-summary-title"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <p id="signup-error-summary-title" className="font-semibold">
                    Please fix the highlighted fields and try again.
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {FIELD_ORDER.filter(({ name }) => errors[name]).map(({ name }) => (
                      <li key={name}>
                        <a
                          href={`#${name}`}
                          onClick={(event) => {
                            event.preventDefault();
                            focusField(name);
                          }}
                          className="underline hover:text-red-800"
                        >
                          {errors[name]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
              <FormField id="name" label="Full name" error={errors.name}>
                <Input
                  type="text"
                  value={values.name}
                  onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
                  onBlur={() => validate(values)}
                  placeholder="Your full name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-xs text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>
                />
              </FormField>

              <FormField id="email" label="Email" error={errors.email}>
                <Input
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                  onBlur={() => validate(values)}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
                />
              </FormField>

              <FormField id="password" label="Password" error={errors.password}>
                <Input
                  type="password"
                  value={values.password}
                  onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                  onBlur={() => validate(values)}
                  placeholder="Create a password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>
                />
              </FormField>

              <FormField id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
                <Input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(event) => setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  onBlur={() => validate(values)}
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
                />
              </FormField>

              <label className="inline-flex items-start gap-2 text-sm text-[#26215C]">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  aria-invalid={!!errors.acceptTerms}
                  aria-invalid={errors.acceptTerms ? true : undefined}
                  aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
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
              {errors.acceptTerms && (
                <p id="acceptTerms-error" className="text-xs text-red-600">
                  {errors.acceptTerms}
                </p>
              )}
              <FieldError id="acceptTerms-error" className="mt-0">
                {errors.acceptTerms}
              </FieldError>

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
