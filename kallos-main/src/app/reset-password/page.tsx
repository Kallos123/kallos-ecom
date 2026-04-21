"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/auth-context';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || password.length < 8) {
      setError('Use at least 8 characters, including one uppercase letter and one number.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setCompleted(true);
    } catch (err: any) {
      setError(err.message || 'This reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Set a new password"
      title={completed ? 'Password Updated' : 'Reset Password'}
      description={completed ? 'Your password has been updated. You can sign in with the new one now.' : 'Choose a new password for your KALLOS account.'}
      imageUrl="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200"
      featureTitle={<>Restore your<br /><span className="italic text-kallos-gold">account access</span></>}
      featureSubtitle="One secure step and you are back in"
      footer={
        <p className="text-kallos-ivory/40 text-xs tracking-wide text-center">
          Remembered it instead?{' '}
          <Link href="/login" className="text-kallos-ivory hover:text-kallos-gold transition-colors">
            Return to sign in
          </Link>
        </p>
      }
    >
      {completed ? (
        <Link
          href="/login"
          className="block w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase text-center hover:bg-kallos-gold transition-colors duration-300"
        >
          Go to Sign In
        </Link>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
              placeholder="Repeat your password"
            />
          </div>

          {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}