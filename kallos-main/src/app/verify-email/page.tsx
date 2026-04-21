"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/auth-context';

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { user, verifyEmail, resendVerification } = useAuth();

  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? 'We are verifying your email now.' : 'This verification link is incomplete.'
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const runVerification = async () => {
      try {
        await verifyEmail(token);
        if (cancelled) return;
        setState('success');
        setMessage('Your email is now verified. You can continue shopping with full account trust restored.');
      } catch (err: any) {
        if (cancelled) return;
        setState('error');
        setMessage(err.message || 'This verification link is invalid or expired.');
      }
    };

    void runVerification();

    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setMessage('A fresh verification email has been sent to your inbox.');
    } catch (err: any) {
      setMessage(err.message || 'Unable to resend verification right now.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Trust restored"
      title={state === 'success' ? 'Email Verified' : state === 'loading' ? 'Verifying Email' : 'Verification Issue'}
      description={message}
      imageUrl="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200"
      featureTitle={<>Keep your<br /><span className="italic text-kallos-gold">account trusted</span></>}
      featureSubtitle="Verification keeps recovery and order updates reliable"
      footer={
        <p className="text-kallos-ivory/40 text-xs tracking-wide text-center">
          Need to sign in first?{' '}
          <Link href="/login" className="text-kallos-ivory hover:text-kallos-gold transition-colors">
            Return to sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {state === 'loading' ? (
          <div className="w-full py-4 border border-kallos-ivory/15 text-kallos-ivory/60 text-xs tracking-[0.3em] uppercase text-center">
            Verifying...
          </div>
        ) : state === 'success' ? (
          <Link
            href={user ? '/account' : '/login'}
            className="block w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase text-center hover:bg-kallos-gold transition-colors duration-300"
          >
            {user ? 'Go to Account' : 'Continue to Sign In'}
          </Link>
        ) : (
          <>
            <div className="w-full py-4 border border-red-400/30 text-red-300 text-xs tracking-wide text-center">
              {message}
            </div>
            {user && user.isEmailVerified === false && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-4 border border-kallos-gold/40 text-kallos-gold text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold hover:text-kallos-black transition-colors duration-300 disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification'}
              </button>
            )}
          </>
        )}
      </div>
    </AuthShell>
  );
}