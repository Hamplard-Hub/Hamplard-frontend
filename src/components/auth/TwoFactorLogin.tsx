'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { twoFactorCodeSchema } from '@/lib/validations/two-factor';

interface TwoFactorLoginProps {
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TwoFactorLogin({ onVerify, onCancel, isLoading = false }: TwoFactorLoginProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate code format
    try {
      if (useBackupCode) {
        // Backup codes can be variable length
        if (!code.trim()) {
          throw new Error('Backup code is required.');
        }
      } else {
        twoFactorCodeSchema.parse({ code });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Invalid code format');
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      setCode(value);
    } else {
      // Only allow digits and max 6
      setCode(value.replace(/\D/g, '').slice(0, 6));
    }
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26215C]">Two-Factor Authentication</h2>
          <p className="mt-2 text-sm text-[#554F99]">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#26215C]" htmlFor="2fa-code">
            {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
          </label>
          <input
            id="2fa-code"
            type={useBackupCode ? 'text' : 'text'}
            inputMode={useBackupCode ? 'text' : 'numeric'}
            maxLength={useBackupCode ? 20 : 6}
            placeholder={useBackupCode ? 'e.g., abcd-1234' : '000000'}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={isSubmitting || isLoading}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#26215C] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
              error
                ? 'border-red-400 bg-red-50/40'
                : 'border-[#D3D0F2] focus:border-[#7F77DD]'
            } ${!useBackupCode ? 'text-center text-2xl font-semibold tracking-widest' : ''}`}
          />
          {error && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="use-backup"
            type="checkbox"
            checked={useBackupCode}
            onChange={(e) => {
              setUseBackupCode(e.target.checked);
              setCode('');
              setError('');
            }}
            disabled={isSubmitting || isLoading}
            className="h-4 w-4 rounded border-[#B3ADDF] text-[#7F77DD] focus:ring-[#7F77DD] disabled:cursor-not-allowed"
          />
          <label htmlFor="use-backup" className="text-sm text-[#554F99] cursor-pointer flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            Use backup code instead
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || !code}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="w-full rounded-xl border border-[#D3D0F2] px-4 py-3 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back
        </button>
      </form>
    </div>
  );
}
