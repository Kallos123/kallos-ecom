"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthShell } from '@/components/auth/AuthShell';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/auth-context';

export default function OtpLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestOtp, verifyOtp } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestOtp(email);
      setOtpRequested(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send a code right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Passwordless sign in"
      title="Sign In With a Code"
      description={otpRequested ? 'Enter the 6-digit code sent to your email.' : 'We will send a one-time login code to your inbox.'}
      imageUrl="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200"
      featureTitle={<>Fast access,<br /><span className="italic text-kallos-crimson">no password required</span></>}
      featureSubtitle="A quicker way back into KALLOS"
      footer={
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-kallos-ivory/45">
          <Link href="/login" className="hover:text-kallos-crimson transition-colors">
            Use your password instead
          </Link>
          {otpRequested && (
            <button
              type="button"
              onClick={() => requestOtp(email)}
              className="hover:text-kallos-crimson transition-colors"
            >
              Resend code
            </button>
          )}
        </div>
      }
    >
      {!otpRequested ? (
        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div>
            <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-crimson transition-colors text-sm"
              placeholder="your@email.com"
            />
          </div>

          {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Login Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-8">
          <div>
            <p className="text-kallos-ivory/70 text-sm mb-5">Code sent to <span className="text-kallos-ivory">{email}</span></p>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              containerClassName="justify-between"
            >
              <InputOTPGroup className="w-full justify-between gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-12 rounded-none border border-kallos-ivory/20 bg-kallos-charcoal text-kallos-ivory first:rounded-none first:border-l last:rounded-none data-[active=true]:border-kallos-crimson data-[active=true]:ring-kallos-crimson/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}