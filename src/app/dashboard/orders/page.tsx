'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Download, RefreshCw } from 'lucide-react';

interface Order {
  id: string;
  date: string;
  courses: string[];
  amount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_001',
    date: '2024-12-01T10:00:00Z',
    courses: ['Introduction to Tailoring', 'Advanced Pattern Making'],
    amount: 4900,
    paymentMethod: 'Stellar (XLM)',
    status: 'COMPLETED',
  },
  {
    id: 'ord_002',
    date: '2024-11-15T14:30:00Z',
    courses: ['Cake Pricing Mastery'],
    amount: 2500,
    paymentMethod: 'Card',
    status: 'COMPLETED',
  },
  {
    id: 'ord_003',
    date: '2024-10-20T09:00:00Z',
    courses: ['Business Basics for Artisans'],
    amount: 1500,
    paymentMethod: 'Stellar (XLM)',
    status: 'REFUNDED',
  },
];

const statusClass: Record<Order['status'], string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(MOCK_ORDERS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-saffron-600" />
          <h1 className="section-heading">Purchase History</h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-ink-100 rounded w-1/4 mb-2" />
              <div className="h-3 bg-ink-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <ShoppingBag className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">No orders yet</p>
          <p className="text-xs text-ink-400 mt-1">Your purchase history will appear here.</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">Browse Courses</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Date</th>
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Courses</th>
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Amount</th>
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Payment</th>
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Status</th>
                <th className="text-left p-4 text-xs text-ink-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors">
                  <td className="p-4 text-ink-600">{formatDate(order.date)}</td>
                  <td className="p-4">
                    <ul className="space-y-0.5">
                      {order.courses.map((c) => (
                        <li key={c} className="text-ink-800 font-medium">{c}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 text-ink-800 font-medium">{formatAmount(order.amount)}</td>
                  <td className="p-4 text-ink-600">{order.paymentMethod}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="btn-secondary text-xs inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Receipt
                      </Link>
                      {order.status === 'COMPLETED' && (
                        <Link
                          href={`/dashboard/orders/${order.id}?refund=1`}
                          className="text-xs text-red-500 hover:underline inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Refund
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
