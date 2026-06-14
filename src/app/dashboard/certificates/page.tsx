'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { certificatesApi } from '@/lib/api/services';
import { formatDate, shortAddress, copyToClipboard } from '@/lib/utils';
import type { Certificate } from '@/types';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState<string | null>(null);

  useEffect(() => {
    certificatesApi.getMy()
      .then(setCertificates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (id: string) => {
    await copyToClipboard(`${window.location.origin}/certificates/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="animate-pulse space-y-3">
    {[1,2].map((i) => <div key={i} className="card h-32" />)}
  </div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-heading">My Certificates</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="card p-12 text-center">
          <Award className="w-12 h-12 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No certificates yet</p>
          <p className="text-xs text-ink-400 mt-1">
            Complete a course to earn your first blockchain-verified certificate.
          </p>
          <Link href="/dashboard/courses" className="btn-primary mt-4 inline-flex">
            Go to my courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="card p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink-900 leading-tight mb-0.5">
                    {cert.courseTitle}
                  </h2>
                  <p className="text-sm text-ink-500 mb-3">
                    Issued {formatDate(cert.issuedAt)}
                    {cert.isRevoked && (
                      <span className="ml-2 text-xs text-red-600 font-medium">(Revoked)</span>
                    )}
                  </p>

                  {/* Certificate ID */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-ink-400">Certificate ID:</span>
                    <code className="text-xs font-mono text-ink-700 bg-ink-50 px-2 py-0.5 rounded-lg">
                      {cert.id}
                    </code>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopy(cert.id)}
                      className="btn-secondary text-xs"
                    >
                      {copied === cert.id
                        ? <><CheckCircle2 className="w-3.5 h-3.5 text-leaf-500" />Copied!</>
                        : <><Copy className="w-3.5 h-3.5" />Copy verification link</>
                      }
                    </button>
                    <Link
                      href={`/certificates/${cert.id}`}
                      className="btn-ghost text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View certificate
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
