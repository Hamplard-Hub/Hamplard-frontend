import { certificatesApi } from '@/lib/api/services';
import { formatDate, shortAddress } from '@/lib/utils';
import { Award, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Props { params: { id: string } }

export default async function CertificateVerifyPage({ params }: Props) {
  let result: any = null;
  let error = false;

  try {
    result = await certificatesApi.verify(params.id);
  } catch {
    error = true;
  }

  const cert = result?.certificate;
  const valid = result?.valid;

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-xl font-semibold text-ink-900">
            Hamplard
          </Link>
          <p className="text-sm text-ink-400 mt-1">Certificate Verification</p>
        </div>

        {error || !cert ? (
          <div className="card p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">
              Certificate not found
            </h1>
            <p className="text-sm text-ink-500">
              {result?.reason ?? 'This certificate ID does not exist or has been revoked.'}
            </p>
          </div>
        ) : !valid ? (
          <div className="card p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">
              Invalid certificate
            </h1>
            <p className="text-sm text-ink-500">{result?.reason}</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Gold header */}
            <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 p-6 text-center text-white">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <p className="text-sm font-medium opacity-80">Certificate of Completion</p>
            </div>

            {/* Valid badge */}
            <div className="flex justify-center -mt-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 bg-leaf-50 border border-leaf-200 px-3 py-1.5 rounded-full shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified on Stellar blockchain
              </span>
            </div>

            <div className="px-8 pb-8">
              <div className="text-center mb-6">
                <p className="text-xs text-ink-400 mb-1">This certifies that</p>
                <p className="font-display text-xl font-semibold text-ink-900">
                  {cert.student?.name ?? shortAddress(cert.student?.stellarAddress ?? '', 6)}
                </p>
                <p className="text-xs text-ink-400 mt-1 font-mono">
                  {cert.student?.stellarAddress}
                </p>
              </div>

              <div className="text-center mb-6">
                <p className="text-xs text-ink-400 mb-1">has successfully completed</p>
                <h1 className="font-display text-2xl font-bold text-ink-900">
                  {cert.courseTitle}
                </h1>
                <p className="text-sm text-ink-500 mt-1">
                  taught by {cert.course?.instructor?.name ?? 'Hamplard Instructor'}
                </p>
              </div>

              <div className="bg-ink-50 rounded-xl p-4 space-y-2 mb-6">
                {[
                  { label: 'Certificate ID', value: cert.id, mono: true },
                  { label: 'Issue date',     value: formatDate(cert.issuedAt) },
                  { label: 'On-chain tx',    value: cert.txHash ? shortAddress(cert.txHash, 8) : 'Pending', mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-ink-400">{label}</span>
                    <span className={`text-ink-700 ${mono ? 'font-mono' : 'font-medium'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs text-ink-400 mb-2">
                  This certificate is permanently recorded on the Stellar blockchain and cannot be forged.
                </p>
                <Link href="/" className="text-xs text-saffron-600 hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  hamplard.com
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
