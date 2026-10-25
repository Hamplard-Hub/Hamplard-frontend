'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Award,
  Calendar,
  User,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { certificatesApi } from '@/lib/api/services';
import { formatDate, shortAddress } from '@/lib/utils';
import type { Certificate } from '@/types';

function VerifyCertificateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('code') || '';

  const [inputVal, setInputVal] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = useCallback(async (certId: string) => {
    const trimmed = certId.trim();
    if (!trimmed) return;

    setLoading(true);
    setCertificate(null);
    setIsValid(null);
    setStatusMessage(null);

    try {
      const res = await certificatesApi.verify(trimmed);
      if (res?.certificate && res.valid) {
        setCertificate(res.certificate);
        setIsValid(true);
      } else {
        setIsValid(false);
        setStatusMessage(res?.reason || 'This certificate is invalid or has been revoked.');
      }
    } catch {
      setIsValid(false);
      setStatusMessage('Certificate not found. Please double-check the certificate ID and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-verify if ID provided in query params on mount
  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId, handleVerify]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    router.replace(`/verify?id=${encodeURIComponent(inputVal.trim())}`, { scroll: false });
    handleVerify(inputVal.trim());
  };

  const copyVerificationLink = () => {
    if (typeof window !== 'undefined' && certificate) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInputVal('');
    setCertificate(null);
    setIsValid(null);
    setStatusMessage(null);
    router.replace('/verify', { scroll: false });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Verify Certificate
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Verify authentic Hamplard course certificates and credentials anchored on the Stellar blockchain.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="certificate-id-input" className="sr-only">
                Certificate ID or Code
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="certificate-id-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter Certificate ID (e.g. cert_123456789)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify'
              )}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm animate-pulse">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Verifying on-chain cryptographic proof…</p>
            <p className="text-xs text-slate-400 mt-1">Querying the Stellar blockchain network</p>
          </div>
        )}

        {/* Verified Success Card */}
        {!loading && isValid === true && certificate && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-md overflow-hidden animate-fade-in mb-8">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">Official Certificate of Completion</h2>
                  <p className="text-xs text-emerald-100">Hamplard Learning Credential</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified Valid
              </span>
            </div>

            {/* Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
                    Recipient
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-lg font-bold text-slate-900">
                      {certificate.student?.name || (certificate.student?.stellarAddress ? shortAddress(certificate.student.stellarAddress, 6) : 'Learner')}
                    </p>
                  </div>
                  {certificate.student?.stellarAddress && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {certificate.student.stellarAddress}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
                    Course Completed
                  </span>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <p className="text-lg font-bold text-slate-900">
                      {certificate.courseTitle || certificate.course?.title || 'Hamplard Course'}
                    </p>
                  </div>
                  {certificate.course?.instructor?.name && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instructor: {certificate.course.instructor.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata rows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Issue Date
                  </span>
                  <span className="font-medium text-slate-800">
                    {certificate.issuedAt ? formatDate(certificate.issuedAt) : 'Verified'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Certificate ID
                  </span>
                  <span className="font-mono text-xs text-slate-800 font-medium break-all">
                    {certificate.id}
                  </span>
                </div>
              </div>

              {/* On-chain verification */}
              {certificate.txHash && (
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-indigo-900 block">Stellar Blockchain Anchor</span>
                    <span className="text-xs text-indigo-600 font-mono truncate max-w-sm block">
                      {certificate.txHash}
                    </span>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${certificate.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors"
                  >
                    View on Explorer <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={copyVerificationLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Copy Verification Link'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Verify Another
                  </button>
                  <Link
                    href={`/certificates/${certificate.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    View Full Certificate <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invalid / Not Found State */}
        {!loading && isValid === false && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm animate-fade-in mb-8">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              {statusMessage || 'The certificate could not be verified. It may be invalid, revoked, or the ID is incorrect.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Try Another ID
              </button>
            </div>
          </div>
        )}

        {/* Information Grid (shown when idle) */}
        {!loading && isValid === null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Blockchain Anchored</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Credentials are permanently anchored to the Stellar blockchain, guaranteeing unalterable proof of completion.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Instant Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Employers and institutions can independently verify qualifications in seconds without waiting for manual checks.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Tamper-Proof</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cryptographic signatures ensure certificates cannot be forged, manipulated, or illicitly transferred.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading verification portal…
          </div>
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}
