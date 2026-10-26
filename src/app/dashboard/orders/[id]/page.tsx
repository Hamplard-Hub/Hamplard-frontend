'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Download, AlertCircle } from 'lucide-react';

interface OrderDetail {
  id: string;
  date: string;
  courses: Array<{ title: string; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  buyerName: string;
  buyerEmail: string;
}

const MOCK_DETAILS: Record<string, OrderDetail> = {
  ord_001: {
    id: 'ord_001',
    date: '2024-12-01T10:00:00Z',
    courses: [
      { title: 'Introduction to Tailoring', price: 2900 },
      { title: 'Advanced Pattern Making', price: 2000 },
    ],
    subtotal: 4900,
    tax: 0,
    total: 4900,
    paymentMethod: 'Stellar (XLM)',
    status: 'COMPLETED',
    buyerName: 'Student User',
    buyerEmail: 'student@example.com',
  },
  ord_002: {
    id: 'ord_002',
    date: '2024-11-15T14:30:00Z',
    courses: [{ title: 'Cake Pricing Mastery', price: 2500 }],
    subtotal: 2500,
    tax: 0,
    total: 2500,
    paymentMethod: 'Card',
    status: 'COMPLETED',
    buyerName: 'Student User',
    buyerEmail: 'student@example.com',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const showRefund = searchParams.get('refund') === '1';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundRequested, setRefundRequested] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrder(MOCK_DETAILS[id] ?? null);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-6 bg-ink-100 rounded w-1/3" />
          <div className="h-4 bg-ink-100 rounded w-1/2" />
          <div className="h-4 bg-ink-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">Order not found</p>
          <Link href="/dashboard/orders" className="btn-secondary mt-4 inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link href="/dashboard/orders" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Orders
        </Link>
        <button onClick={() => window.print()} className="btn-secondary inline-flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          Save PDF
        </button>
      </div>

      <div className="card p-8" id="receipt">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Receipt</h1>
            <p className="text-sm text-ink-500 mt-1">Order #{order.id}</p>
          </div>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-ink-400 mb-1">Billed to</p>
            <p className="font-medium text-ink-800">{order.buyerName}</p>
            <p className="text-ink-500">{order.buyerEmail}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400 mb-1">Date</p>
            <p className="font-medium text-ink-800">{formatDate(order.date)}</p>
            <p className="text-xs text-ink-400 mt-2">Payment method</p>
            <p className="font-medium text-ink-800">{order.paymentMethod}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-2 text-xs text-ink-400 font-medium">Course</th>
              <th className="text-right py-2 text-xs text-ink-400 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.courses.map((c) => (
              <tr key={c.title} className="border-b border-ink-50">
                <td className="py-3 text-ink-800">{c.title}</td>
                <td className="py-3 text-right text-ink-800">{formatAmount(c.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm text-right">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span>{formatAmount(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Tax</span>
            <span>{formatAmount(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-ink-900 text-base pt-2 border-t border-ink-100">
            <span>Total</span>
            <span>{formatAmount(order.total)}</span>
          </div>
        </div>

        {showRefund && !refundRequested && order.status === 'COMPLETED' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm font-medium text-yellow-800 mb-1">Request a Refund</p>
            <p className="text-xs text-yellow-600 mb-3">
              Refunds are available within 14 days of purchase.
            </p>
            <button
              onClick={() => setRefundRequested(true)}
              className="btn-secondary text-sm"
            >
              Submit Refund Request
            </button>
          </div>
        )}

        {refundRequested && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-medium text-green-800">
              Refund request submitted. We will process it within 3–5 business days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
