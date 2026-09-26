'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useToastContext } from '@/components/ui/ToastProvider';
import { contactApi } from '@/lib/api/services';
import { contactFormSchema, type ContactFormData } from '@/lib/validations/contact';

type FormErrors = Partial<Record<keyof ContactFormData, string>>;

const subjects = ['General', 'Billing', 'Technical', 'Instructor', 'Report'] as const;

export default function ContactPage() {
  const [values, setValues] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: 'General',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToastContext();

  const validate = (data: ContactFormData): boolean => {
    try {
      contactFormSchema.parse(data);
      setErrors({});
      return true;
    } catch (err: any) {
      const nextErrors: FormErrors = {};
      err.errors?.forEach((error: any) => {
        nextErrors[error.path[0] as keyof ContactFormData] = error.message;
      });
      setErrors(nextErrors);
      return false;
    }
  };

  const handleChange = (
    field: keyof ContactFormData,
    value: string,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate(values)) return;

    setIsSubmitting(true);
    try {
      await contactApi.submitContactForm({
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      });

      setSubmitted(true);
      setValues({ name: '', email: '', subject: 'General', message: '' });
      toast.success({
        title: 'Message sent!',
        description: 'We\'ve received your message and will get back to you soon.',
        duration: 5000,
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send message. Please try again.';
      toast.error({
        title: 'Error',
        description: errorMessage,
      });
      setErrors((prev) => ({
        ...prev,
        message: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 xl:px-10">
        {/* Header Section */}
        <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
            Get in touch
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Contact our support team
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5A5578]">
            Have questions or need help? We&apos;re here to help. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm lg:col-span-2">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#26215C]">Message sent successfully!</h2>
                <p className="text-sm text-[#5A5578]">
                  Thank you for contacting us. We&apos;ll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={onSubmit} noValidate>
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-[#26215C]" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={values.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-[#26215C] outline-none transition ${
                      errors.name
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                    }`}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-[#26215C]" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-[#26215C] outline-none transition ${
                      errors.email
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                    }`}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-[#26215C]" htmlFor="subject">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={values.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-[#26215C] outline-none transition ${
                      errors.subject
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                    }`}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.subject}
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-medium text-[#26215C]" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={values.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className={`mt-2 min-h-32 w-full rounded-xl border px-4 py-3 text-sm text-[#26215C] outline-none transition resize-none ${
                      errors.message
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-[#D3D0F2] focus:border-[#7F77DD]'
                    }`}
                    placeholder="Tell us how we can help you..."
                    disabled={isSubmitting}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#7F77DD] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </section>

          {/* Contact Info Sidebar */}
          <section className="flex flex-col gap-6">
            {/* Email Card */}
            <div className="rounded-[32px] border border-[#D5D2F6] bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEEDFE]">
                <Mail className="h-6 w-6 text-[#7F77DD]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#26215C]">Email us</h3>
              <p className="mt-2 text-sm text-[#5A5578]">
                Send us an email directly or use the form above.
              </p>
              <Link
                href="mailto:support@hamplard.app"
                className="mt-4 inline-block text-sm font-semibold text-[#7F77DD] hover:underline"
              >
                support@hamplard.app
              </Link>
            </div>

            {/* Response Time Card */}
            <div className="rounded-[32px] border border-[#D5D2F6] bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEEDFE]">
                <Clock className="h-6 w-6 text-[#7F77DD]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#26215C]">Response time</h3>
              <p className="mt-2 text-sm text-[#5A5578]">
                We typically respond to messages within 24-48 hours during business days.
              </p>
            </div>

            {/* Help Center Link */}
            <div className="rounded-[32px] border border-[#D5D2F6] bg-gradient-to-br from-[#7F77DD]/10 to-[#EEEDFE]/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#26215C]">Need quick help?</h3>
              <p className="mt-2 text-sm text-[#5A5578]">
                Check our help center for common questions and answers.
              </p>
              <Link
                href="/help"
                className="mt-4 inline-block text-sm font-semibold text-[#7F77DD] hover:underline"
              >
                Visit Help Center →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
