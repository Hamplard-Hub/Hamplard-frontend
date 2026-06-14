'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Wallet, BookOpen, Video, ShieldCheck } from 'lucide-react';
import { connectFreighter, isFreighterInstalled, signNonce } from '@/lib/stellar/freighter';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { Networks } from '@stellar/stellar-sdk';

type Step = 'idle' | 'connecting' | 'signing' | 'verifying' | 'done';
type Role = 'STUDENT' | 'INSTRUCTOR';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard/courses';
  const defaultRole = (params.get('role') as Role) ?? 'STUDENT';

  const { setAuth, isConnected } = useAuthStore();
  const [role, setRole]          = useState<Role>(defaultRole);
  const [step, setStep]          = useState<Step>('idle');
  const [error, setError]        = useState<string | null>(null);
  const [hasFreighter, setHasFreighter] = useState<boolean | null>(null);

  useEffect(() => { if (isConnected) router.replace(callbackUrl); }, [isConnected]);
  useEffect(() => { isFreighterInstalled().then(setHasFreighter); }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      setStep('connecting');
      const address = await connectFreighter();
      const nonce   = await authApi.getNonce(address);

      setStep('signing');
      const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
        ? Networks.PUBLIC : Networks.TESTNET;
      const signedNonce = await signNonce(nonce, networkPassphrase);

      setStep('verifying');
      const { accessToken, user } = await authApi.login({
        stellarAddress: address,
        signedNonce,
        signature: signedNonce,
        role,
      });

      setAuth(address, accessToken, user);
      setStep('done');
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err?.message ?? 'Connection failed. Please try again.');
      setStep('idle');
    }
  };

  const stepLabel: Record<Step, string> = {
    idle:      'Connect Freighter Wallet',
    connecting:'Connecting to wallet…',
    signing:   'Sign the message in Freighter…',
    verifying: 'Verifying with server…',
    done:      'Redirecting…',
  };

  const isLoading = step !== 'idle';

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="font-display text-2xl font-bold text-ink-900">Hamplard</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            Connect your Freighter wallet to access the platform.
          </p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="label">I want to</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole('STUDENT')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  role === 'STUDENT'
                    ? 'border-saffron-500 bg-saffron-50'
                    : 'border-ink-100 bg-white hover:border-ink-200'
                }`}
              >
                <BookOpen className={`w-4 h-4 mb-1.5 ${role === 'STUDENT' ? 'text-saffron-600' : 'text-ink-400'}`} />
                <p className={`text-sm font-medium ${role === 'STUDENT' ? 'text-saffron-700' : 'text-ink-700'}`}>
                  Learn a skill
                </p>
                <p className="text-xs text-ink-400 mt-0.5">Student account</p>
              </button>
              <button
                onClick={() => setRole('INSTRUCTOR')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  role === 'INSTRUCTOR'
                    ? 'border-saffron-500 bg-saffron-50'
                    : 'border-ink-100 bg-white hover:border-ink-200'
                }`}
              >
                <Video className={`w-4 h-4 mb-1.5 ${role === 'INSTRUCTOR' ? 'text-saffron-600' : 'text-ink-400'}`} />
                <p className={`text-sm font-medium ${role === 'INSTRUCTOR' ? 'text-saffron-700' : 'text-ink-700'}`}>
                  Teach a skill
                </p>
                <p className="text-xs text-ink-400 mt-0.5">Instructor account</p>
              </button>
            </div>
          </div>

          {/* Freighter not installed */}
          {hasFreighter === false && (
            <div className="mb-5 p-4 rounded-xl bg-saffron-50 border border-saffron-100">
              <p className="text-sm font-medium text-saffron-800 mb-1">Freighter wallet not found</p>
              <p className="text-xs text-saffron-700 mb-3">
                Install the Freighter browser extension to sign in with your Stellar address.
              </p>
              <a href="https://freighter.app" target="_blank" rel="noreferrer"
                className="btn-primary text-xs px-3 py-1.5">
                Install Freighter →
              </a>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading || hasFreighter === false}
            className="btn-primary w-full text-base py-3"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{stepLabel[step]}</>
              : <><Wallet className="w-4 h-4" />{stepLabel.idle}</>
            }
          </button>

          {isLoading && (
            <div className="mt-4 space-y-2">
              {(['connecting', 'signing', 'verifying'] as Step[]).map((s, i) => {
                const order = ['connecting', 'signing', 'verifying'];
                const cur   = order.indexOf(step);
                const idx   = order.indexOf(s);
                return (
                  <div key={s} className="flex items-center gap-2.5 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-[10px] font-semibold ${
                      idx < cur  ? 'bg-leaf-500 text-white' :
                      s === step ? 'bg-saffron-500 text-white' : 'bg-ink-100 text-ink-400'
                    }`}>
                      {idx < cur ? '✓' : i + 1}
                    </div>
                    <span className={s === step ? 'text-ink-900 font-medium' : 'text-ink-400'}>
                      {stepLabel[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: ShieldCheck, label: 'Secure payments', sub: 'Stellar blockchain' },
            { icon: BookOpen,    label: 'Structured learning', sub: 'Beginner to pro' },
            { icon: Video,       label: 'Your certificate', sub: 'Verifiable on-chain' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="card p-3">
              <Icon className="w-4 h-4 text-saffron-600 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-ink-700">{label}</p>
              <p className="text-[10px] text-ink-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
