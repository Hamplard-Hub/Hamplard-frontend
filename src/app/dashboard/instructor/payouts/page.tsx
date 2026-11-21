'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Clock, TrendingUp, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { formatUsdc } from '@/lib/utils';

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'PAID' | 'PENDING' | 'PROCESSING';
}

interface PayoutStats {
  available: number;
  pending: number;
  lifetime: number;
}

const MOCK_STATS: PayoutStats = {
  available: 125000,
  pending: 43000,
  lifetime: 890000,
};

const MOCK_HISTORY: PayoutRecord[] = [
  { id: 'pay_001', date: '2024-12-01', amount: 75000, method: 'Stellar (XLM)', status: 'PAID' },
  { id: 'pay_002', date: '2024-11-01', amount: 60000, method: 'Bank Transfer', status: 'PAID' },
  { id: 'pay_003', date: '2024-10-01', amount: 55000, method: 'Stellar (XLM)', status: 'PAID' },
];

const statusClass: Record<PayoutRecord['status'], string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function InstructorPayoutsPage() {
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState<'stellar' | 'bank' | null>(null);
  const [stellarAddress, setStellarAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [methodSaved, setMethodSaved] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setHistory(MOCK_HISTORY);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveMethod = () => {
    setMethodSaved(true);
  };

  const handleRequestPayout = () => {
    setRequestSent(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading">Payouts</h1>
        {!requestSent ? (
          <button
            onClick={handleRequestPayout}
            className="btn-primary"
            disabled={!methodSaved}
            title={!methodSaved ? 'Set a payout method first' : ''}
          >
            Request Payout
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Payout requested
          </div>
        )}
      </div>

      {/* Balance cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-ink-100 rounded w-1/2 mb-3" />
              <div className="h-6 bg-ink-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: DollarSign, label: 'Available', value: formatUsdc(stats!.available), color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Clock, label: 'Pending', value: formatUsdc(stats!.pending), color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { icon: TrendingUp, label: 'Lifetime', value: formatUsdc(stats!.lifetime), color: 'text-saffron-600', bg: 'bg-saffron-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xs text-ink-400">{label}</p>
              </div>
              <p className="text-2xl font-bold text-ink-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payout method */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-ink-900 mb-4">Payout Method</h2>

        {methodSaved ? (
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {payoutMethod === 'stellar' ? `Stellar address saved` : `Bank details saved`}
            </span>
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setPayoutMethod('stellar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  payoutMethod === 'stellar'
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                    : 'border-ink-200 text-ink-600 hover:border-saffron-300'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Stellar Address
              </button>
              <button
                onClick={() => setPayoutMethod('bank')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  payoutMethod === 'bank'
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                    : 'border-ink-200 text-ink-600 hover:border-saffron-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Bank Transfer
              </button>
            </div>

            {payoutMethod === 'stellar' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="G... (Stellar public key)"
                  value={stellarAddress}
                  onChange={(e) => setStellarAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <button
                  onClick={handleSaveMethod}
                  disabled={!stellarAddress.trim()}
                  className="btn-primary text-sm"
                >
                  Save Stellar Address
                </button>
              </div>
            )}

            {payoutMethod === 'bank' && (
              <div className="space-y-3">
                <textarea
                  placeholder="Bank name, account number, routing number..."
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 resize-none"
                />
                <button
                  onClick={handleSaveMethod}
                  disabled={!bankDetails.trim()}
                  className="btn-primary text-sm"
                >
                  Save Bank Details
                </button>
              </div>
            )}

            {!payoutMethod && (
              <p className="text-sm text-ink-400">Select a payout method to continue.</p>
            )}
          </>
        )}
      </div>

      {/* Payout history */}
      <div>
        <h2 className="font-semibold text-ink-900 mb-4">Payout History</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-ink-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-ink-400">No payouts yet.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left p-4 text-xs text-ink-400 font-medium">Date</th>
                  <th className="text-left p-4 text-xs text-ink-400 font-medium">Amount</th>
                  <th className="text-left p-4 text-xs text-ink-400 font-medium">Method</th>
                  <th className="text-left p-4 text-xs text-ink-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((payout) => (
                  <tr key={payout.id} className="border-b border-ink-50">
                    <td className="p-4 text-ink-600">{formatDate(payout.date)}</td>
                    <td className="p-4 font-medium text-ink-900">{formatUsdc(payout.amount)}</td>
                    <td className="p-4 text-ink-600">{payout.method}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[payout.status]}`}>
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
