"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
}

interface TransactionsData {
  transactions: Transaction[];
  total: number;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatReason = (r: string) =>
  r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet'),
  });

  const { data: txData, isLoading: txLoading } = useQuery<TransactionsData>({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get('/wallet/transactions'),
  });

  const transactions = txData?.transactions ?? [];

  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-3">Balance</p>
      <h1 className="font-editorial text-4xl text-kallos-ivory mb-10">My Wallet</h1>

      {/* Balance card */}
      <div className="bg-kallos-charcoal p-8 mb-10 flex items-center gap-6">
        <div className="w-14 h-14 bg-kallos-black flex items-center justify-center flex-shrink-0">
          <Wallet className="w-6 h-6 text-kallos-crimson" />
        </div>
        <div>
          <p className="text-kallos-warm-grey text-xs tracking-widest uppercase mb-1">Available Balance</p>
          {walletLoading ? (
            <div className="h-8 w-32 bg-kallos-ivory/10 animate-pulse" />
          ) : (
            <p className="font-editorial text-3xl text-kallos-ivory">{formatPrice(wallet?.balance ?? 0)}</p>
          )}
        </div>
      </div>

      {/* Transactions */}
      <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-6">Transaction History</h2>

      {txLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-kallos-charcoal animate-pulse" />)}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-kallos-warm-grey">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between bg-kallos-charcoal px-6 py-4 gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
                  {tx.type === 'CREDIT'
                    ? <TrendingUp className="w-4 h-4 text-green-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div>
                  <p className="text-kallos-ivory text-sm">{formatReason(tx.reason)}</p>
                  {tx.description && <p className="text-kallos-warm-grey text-xs mt-0.5">{tx.description}</p>}
                  <p className="text-kallos-ivory/40 text-xs mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-medium ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount)}
                </p>
                <p className="text-kallos-warm-grey text-xs mt-0.5">Bal: {formatPrice(tx.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
