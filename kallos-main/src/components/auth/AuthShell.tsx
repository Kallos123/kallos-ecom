"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  imageUrl: string;
  featureTitle: React.ReactNode;
  featureSubtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  imageUrl,
  featureTitle,
  featureSubtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-kallos-black/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-editorial text-5xl text-kallos-ivory leading-tight mb-4"
          >
            {featureTitle}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-kallos-ivory/50 text-sm tracking-widest uppercase"
          >
            {featureSubtitle}
          </motion.p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm w-full mx-auto"
        >
          <Link
            href="/"
            className="block font-editorial text-2xl tracking-[0.3em] text-foreground mb-16"
          >
            KALLOS
          </Link>

          <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-3">{eyebrow}</p>
          <h1 className="font-editorial text-4xl text-foreground mb-4">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-10">{description}</p>
          )}

          {children}

          {footer && <div className="mt-10">{footer}</div>}
        </motion.div>
      </div>
    </main>
  );
}