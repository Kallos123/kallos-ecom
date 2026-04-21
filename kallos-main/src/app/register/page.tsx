"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-kallos-black flex">
      {/* Left — decorative */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-kallos-black/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-editorial text-5xl text-kallos-ivory leading-tight mb-4"
          >
            Join the<br />
            <span className="italic text-kallos-gold">House of Kallos</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-kallos-ivory/50 text-sm tracking-widest uppercase"
          >
            Exclusive access awaits
          </motion.p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm w-full mx-auto"
        >
          <Link
            href="/"
            className="block font-editorial text-2xl tracking-[0.3em] text-kallos-ivory mb-16"
          >
            KALLOS
          </Link>

          <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-3">Create account</p>
          <h1 className="font-editorial text-4xl text-kallos-ivory mb-10">Register</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  required
                  className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                  placeholder="First"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  required
                  className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                  placeholder="Last"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                autoComplete="new-password"
                className="w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors duration-300 disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-10 text-kallos-ivory/40 text-xs tracking-wide text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-kallos-ivory hover:text-kallos-gold transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
