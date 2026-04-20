"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-kallos-black flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <Link
          href="/"
          className="block font-editorial text-2xl tracking-[0.3em] text-kallos-ivory mb-16 text-center"
        >
          KALLOS
        </Link>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-16 h-px bg-kallos-gold mx-auto mb-8" />
            <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-3">Check your inbox</p>
            <h1 className="font-editorial text-4xl text-kallos-ivory mb-6">Email Sent</h1>
            <p className="text-kallos-ivory/50 text-sm leading-relaxed mb-10">
              If an account exists for <span className="text-kallos-ivory">{email}</span>, you'll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-kallos-ivory/60 hover:text-kallos-gold transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-3">Password recovery</p>
            <h1 className="font-editorial text-4xl text-kallos-ivory mb-4">Forgot Password</h1>
            <p className="text-kallos-ivory/50 text-sm leading-relaxed mb-10">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                  placeholder="your@email.com"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs tracking-wide">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-10 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-kallos-ivory/40 hover:text-kallos-gold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}
