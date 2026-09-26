'use client';

import { useState } from 'react';
import { Download, Copy, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToastContext } from '@/components/ui/ToastProvider';
import { twoFactorApi } from '@/lib/api/services';
import { twoFactorCodeSchema } from '@/lib/validations/two-factor';

type SetupStep = 'inactive' | 'qr-code' | 'verify' | 'backup-codes' | 'error';

export function TwoFactorSetup() {
  const toast = useToastContext();
  const [step, setStep] = useState<SetupStep>('inactive');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const result = await twoFactorApi.setupInitiate();
      setQrCode(result.qrCode);
      setStep('qr-code');
    } catch (error: any) {
      toast.error({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to initiate 2FA setup',
      });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setCodeError('');

    // Validate code format
    try {
      twoFactorCodeSchema.parse({ code });
    } catch (err: any) {
      setCodeError(err.errors?.[0]?.message || 'Invalid code format');
      return;
    }

    setIsLoading(true);
    try {
      const result = await twoFactorApi.setupVerify(code);
      setBackupCodes(result.backupCodes);
      setStep('backup-codes');
      toast.success({
        title: 'Two-Factor Authentication Enabled',
        description: 'Your account is now more secure.',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid code. Please try again.';
      setCodeError(message);
      toast.error({
        title: 'Verification Failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    const confirmCode = prompt('Enter your 6-digit 2FA code to disable two-factor authentication:');
    if (!confirmCode) return;

    setIsLoading(true);
    try {
      await twoFactorApi.disable(confirmCode);
      setStep('inactive');
      setBackupCodes([]);
      setCode('');
      toast.success({
        title: 'Two-Factor Authentication Disabled',
        description: 'Your account is now accessible with password only.',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid code. Please try again.';
      toast.error({
        title: 'Error',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hamplard-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success({
      title: 'Downloaded',
      description: 'Backup codes saved to your device.',
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    toast.success({
      title: 'Copied',
      description: 'Backup codes copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'inactive') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#5A5578]">
          Add an extra layer of security to your account. Once enabled, you'll need your authenticator app in addition to your password to sign in.
        </p>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7F77DD] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            'Enable Two-Factor Authentication'
          )}
        </button>
      </div>
    );
  }

  if (step === 'qr-code') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-[#26215C]">Step 1: Scan QR Code</h3>
          <p className="mt-2 text-sm text-[#5A5578]">
            Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.
          </p>
        </div>

        <div className="flex justify-center p-6 bg-[#EEEDFE] rounded-[16px]">
          {qrCode && (
            <img
              src={qrCode}
              alt="2FA QR Code"
              className="h-64 w-64 rounded-lg"
            />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-[#26215C]">Step 2: Enter Verification Code</h3>
          <p className="mt-2 text-sm text-[#5A5578]">
            After scanning, enter the 6-digit code from your authenticator app.
          </p>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (codeError) setCodeError('');
              }}
              className={`w-full rounded-xl border px-4 py-3 text-center text-2xl font-semibold tracking-widest outline-none transition ${
                codeError
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-[#D3D0F2] focus:border-[#7F77DD]'
              }`}
              disabled={isLoading}
            />
            {codeError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {codeError}
              </p>
            )}
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={isLoading || code.length !== 6}
            className="mt-4 w-full rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify and Enable'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'backup-codes') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-[16px] bg-emerald-50 p-4 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Two-Factor Authentication Enabled</p>
            <p className="mt-1 text-sm text-emerald-700">
              Your account is now protected. Save your backup codes in a safe place.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#26215C]">Backup Codes</h3>
            <button
              type="button"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="text-[#7F77DD] hover:text-[#3C3489]"
              aria-label={showBackupCodes ? 'Hide codes' : 'Show codes'}
            >
              {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-sm text-[#5A5578] mb-4">
            Save these codes in a safe place. Each code can be used once if you lose access to your authenticator app.
          </p>

          <div className="space-y-2 bg-[#EEEDFE] p-4 rounded-[12px] max-h-48 overflow-y-auto">
            {backupCodes.map((backupCode, idx) => (
              <div
                key={idx}
                className="font-mono text-sm text-[#26215C] flex items-center gap-2"
              >
                <span className="text-[#7F77DD]">{idx + 1}.</span>
                <span className={showBackupCodes ? '' : 'blur-sm'}>
                  {backupCode}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={downloadBackupCodes}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-6 py-3 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE]"
          >
            <Download className="h-4 w-4" />
            Download Codes
          </button>

          <button
            onClick={copyBackupCodes}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D3D0F2] px-6 py-3 text-sm font-semibold text-[#26215C] transition hover:bg-[#EEEDFE]"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Codes'}
          </button>

          <button
            onClick={handleDisable}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Disable 2FA
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[16px] bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Setup Failed</p>
            <p className="mt-1 text-sm text-red-700">
              There was an error setting up two-factor authentication. Please try again.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setStep('inactive');
            setCode('');
            setCodeError('');
          }}
          className="w-full rounded-xl bg-[#7F77DD] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3C3489]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
