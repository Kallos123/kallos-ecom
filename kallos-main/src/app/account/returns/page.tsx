"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RotateCcw } from 'lucide-react';

interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
  description: string | null;
  refundMethod: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'text-yellow-400',
  APPROVED: 'text-blue-400',
  REJECTED: 'text-red-400',
  PICKED_UP: 'text-purple-400',
  COMPLETED: 'text-green-400',
};

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export default function ReturnsPage() {
  const { data: returns = [], isLoading } = useQuery<ReturnRequest[]>({
    queryKey: ['returns'],
    queryFn: () => api.get('/returns/my'),
  });

  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-3">History</p>
      <h1 className="font-editorial text-4xl text-kallos-ivory mb-4">My Returns</h1>
      <p className="text-kallos-warm-grey text-xs mb-10">
        To request a return, go to your{' '}
        <Link href="/account/orders" className="text-kallos-ivory hover:text-kallos-crimson transition-colors underline">
          order detail page
        </Link>{' '}
        within 7 days of delivery.
      </p>

      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-kallos-charcoal animate-pulse" />)}</div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw className="w-10 h-10 text-kallos-warm-grey mx-auto mb-4" />
          <p className="text-kallos-warm-grey">No return requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map(ret => (
            <div key={ret.id} className="bg-kallos-charcoal p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link href={`/account/orders/${ret.order.id}`} className="text-kallos-ivory text-sm hover:text-kallos-crimson transition-colors">
                    {ret.order.orderNumber}
                  </Link>
                  <p className="text-kallos-warm-grey text-xs mt-0.5">
                    {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs ${STATUS_COLORS[ret.status] ?? 'text-kallos-warm-grey'}`}>
                  {formatStatus(ret.status)}
                </span>
              </div>
              <div className="text-xs text-kallos-warm-grey space-y-1">
                <p>Reason: {formatStatus(ret.reason)}</p>
                {ret.description && <p>{ret.description}</p>}
                <p>Refund to: {ret.refundMethod === 'WALLET' ? 'Wallet' : 'Original Payment'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
