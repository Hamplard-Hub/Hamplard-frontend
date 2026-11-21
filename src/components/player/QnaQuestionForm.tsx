'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QnaQuestionFormProps {
  onSubmit: (title: string, body: string) => Promise<void>;
  className?: string;
}

const TITLE_MAX = 120;
const BODY_MIN = 10;
const BODY_MAX = 1000;

export function QnaQuestionForm({ onSubmit, className }: QnaQuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [loading, setLoading] = useState(false);

  const isFilled = title.trim().length > 0 && body.trim().length >= BODY_MIN;

  function validate(): boolean {
    const errs: { title?: string; body?: string } = {};
    if (!title.trim()) errs.title = 'Give your question a short title.';
    if (body.trim().length < BODY_MIN) {
      errs.body = `Add a bit more detail (at least ${BODY_MIN} characters).`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      await onSubmit(title.trim(), body.trim());
      setTitle('');
      setBody('');
      setErrors({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('rounded-2xl border border-semantic-border bg-white p-5', className)}>
      <h3 className="text-sm font-semibold text-hamplard-deep mb-3">Ask a question</h3>

      <div className="mb-3">
        <label htmlFor="qna-title" className="block text-xs font-semibold text-hamplard-deep mb-1.5">
          Title
        </label>
        <input
          id="qna-title"
          type="text"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }}
          placeholder="What's your question about?"
          aria-invalid={!!errors.title}
          className={cn(
            'w-full rounded-xl border px-3.5 py-2.5 text-sm text-hamplard-deep bg-white placeholder:text-gray-300 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:border-hamplard-primary',
            errors.title ? 'border-rose-400' : 'border-semantic-border',
          )}
        />
        {errors.title && <p role="alert" className="mt-1 text-xs text-rose-500">{errors.title}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="qna-body" className="block text-xs font-semibold text-hamplard-deep mb-1.5">
          Details
        </label>
        <textarea
          id="qna-body"
          value={body}
          maxLength={BODY_MAX}
          onChange={(e) => { setBody(e.target.value); if (errors.body) setErrors((p) => ({ ...p, body: undefined })); }}
          rows={4}
          placeholder="Add any detail that will help others (or your instructor) answer well…"
          aria-invalid={!!errors.body}
          className={cn(
            'w-full resize-y rounded-xl border px-3.5 py-2.5 text-sm text-hamplard-deep leading-relaxed bg-white placeholder:text-gray-300 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-hamplard-primary focus:border-hamplard-primary',
            errors.body ? 'border-rose-400' : 'border-semantic-border',
          )}
        />
        {errors.body ? (
          <p role="alert" className="mt-1 text-xs text-rose-500">{errors.body}</p>
        ) : (
          <p className="mt-1 text-xs text-semantic-text-muted">{body.length}/{BODY_MAX}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
          isFilled && !loading
            ? 'bg-hamplard-primary text-white hover:bg-hamplard-mid active:bg-hamplard-deep shadow-sm'
            : 'bg-gray-100 text-gray-400',
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Post question
      </button>
    </div>
  );
}