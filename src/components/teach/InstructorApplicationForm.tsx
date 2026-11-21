'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { instructorApplicationSchema, type InstructorApplicationValues } from '@/lib/validations/instructor-application';
import { instructorApplicationApi } from '@/lib/api/services';

export default function InstructorApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InstructorApplicationValues>({
    resolver: zodResolver(instructorApplicationSchema),
  });

  const onSubmit = async (data: InstructorApplicationValues) => {
    setSubmitError(null);
    try {
      await instructorApplicationApi.apply(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-50 p-8 text-center">
        <p className="text-2xl font-bold text-green-700">Application received!</p>
        <p className="mt-2 text-green-600">We will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="app-name" className="block text-sm font-medium text-ink-700 mb-1">
          Full name
        </label>
        <input
          id="app-name"
          type="text"
          placeholder="Jane Doe"
          {...register('name')}
          className="w-full rounded-lg border border-ink-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="app-email" className="block text-sm font-medium text-ink-700 mb-1">
          Email address
        </label>
        <input
          id="app-email"
          type="email"
          placeholder="jane@example.com"
          {...register('email')}
          className="w-full rounded-lg border border-ink-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Expertise Area */}
      <div>
        <label htmlFor="app-expertise" className="block text-sm font-medium text-ink-700 mb-1">
          Expertise area
        </label>
        <input
          id="app-expertise"
          type="text"
          placeholder="e.g. Blockchain Development, DeFi"
          {...register('expertiseArea')}
          className="w-full rounded-lg border border-ink-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
        />
        {errors.expertiseArea && (
          <p className="mt-1 text-sm text-red-600">{errors.expertiseArea.message}</p>
        )}
      </div>

      {/* Portfolio URL */}
      <div>
        <label htmlFor="app-portfolio" className="block text-sm font-medium text-ink-700 mb-1">
          LinkedIn or portfolio URL
        </label>
        <input
          id="app-portfolio"
          type="url"
          placeholder="https://linkedin.com/in/yourname"
          {...register('portfolioUrl')}
          className="w-full rounded-lg border border-ink-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary"
        />
        {errors.portfolioUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.portfolioUrl.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="app-bio" className="block text-sm font-medium text-ink-700 mb-1">
          Brief bio
        </label>
        <textarea
          id="app-bio"
          rows={4}
          placeholder="Tell us about your background and why you want to teach on Hamplard..."
          {...register('bio')}
          className="w-full rounded-lg border border-ink-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-hamplard-primary resize-none"
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      {/* Server-side error */}
      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-hamplard-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-hamplard-mid disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Application
      </button>
    </form>
  );
}
