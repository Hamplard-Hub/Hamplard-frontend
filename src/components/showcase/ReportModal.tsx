'use client';

import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { showcaseApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import type { ShowcaseProject } from '@/types';

interface ReportModalProps {
  project: ShowcaseProject;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Inappropriate or offensive content',
  'Plagiarism or stolen work',
  'Spam, advertising, or self-promotion',
  'Harmful, dangerous, or unsafe practice',
  'Harassment or hate speech',
  'Other',
];

export function ReportModal({ project, isOpen, onClose }: ReportModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await showcaseApi.reportProject(project.id, reason, details);
      setSubmitted(true);
      toast.success({
        title: 'Report submitted',
        description: 'Our moderation team will review this project within 24 hours.',
      });
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch {
      toast.error({
        title: 'Report failed',
        description: 'Unable to submit report. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-in zoom-in" />
            <h3 className="font-display text-lg font-bold text-ink-900">Thank you</h3>
            <p className="text-xs text-ink-500 max-w-xs mx-auto">
              Your report has been logged. We strive to keep Hamplard an inspiring and safe community.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Flag className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 id="report-modal-title" className="font-display text-base font-bold text-ink-900">
                  Report Project
                </h3>
                <p className="text-xs text-ink-500 line-clamp-1">"{project.title}"</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="label text-xs">Reason for reporting</label>
              <div className="space-y-2" role="radiogroup" aria-label="Report reason">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-100 p-2.5 text-xs text-ink-700 hover:bg-ink-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-saffron-600 focus:ring-saffron-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="report-details" className="label text-xs">
                Additional context <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="report-details"
                rows={3}
                placeholder="Describe why this project violates community guidelines..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="textarea text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
