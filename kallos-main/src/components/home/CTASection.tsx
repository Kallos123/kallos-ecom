"use client";

import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-32 lg:py-48 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-kallos-gold to-transparent" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-kallos-gold to-transparent" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-kallos-gold to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-xs tracking-[0.4em] text-kallos-gold mb-6 uppercase"
        >
          Exclusive Access
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-editorial text-4xl md:text-6xl lg:text-7xl text-foreground tracking-wide mb-8"
        >
          Join the
          <br />
          <span className="italic font-light">Inner Circle</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-foreground/60 leading-relaxed mb-12 max-w-lg mx-auto"
        >
          Be the first to access new collections, exclusive offers, 
          and invitations to private events.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="px-6 py-4 bg-transparent border border-foreground/20 text-foreground placeholder:text-foreground/30 text-sm tracking-wide focus:outline-none focus:border-kallos-gold transition-colors min-w-[280px]"
          />
          <button className="px-8 py-4 bg-foreground text-background text-xs tracking-[0.2em] uppercase hover:bg-kallos-gold hover:text-foreground transition-all duration-300">
            Subscribe
          </button>
        </motion.div>
      </div>
    </section>
  );
}
