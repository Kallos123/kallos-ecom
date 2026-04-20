"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

const footerLinks = {
  shop: [
    { name: 'New Arrivals', href: '/shop' },
    { name: 'Clothing', href: '/shop?category=Clothing' },
    { name: 'Accessories', href: '/shop?category=Accessories' },
    { name: 'Jewelry', href: '/shop?category=Jewelry' },
  ],
  support: [
    { name: 'Contact', href: '/contact' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card text-foreground py-20 lg:py-32">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-editorial text-5xl lg:text-7xl tracking-[0.2em] mb-8"
            >
              KALLOS
            </motion.h2>
            <p className="text-foreground/50 text-sm leading-relaxed max-w-xs">
              Timeless elegance, artisan craftsmanship, and understated sophistication for the modern connoisseur.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-kallos-gold">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-kallos-gold transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-kallos-gold">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-kallos-gold transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-kallos-gold">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/60 hover:text-kallos-gold transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-kallos-gold">Newsletter</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Subscribe for exclusive access and updates.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent border-b border-foreground/20 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-kallos-gold transition-colors"
              />
            </form>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-foreground/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground/40">
            &copy; {new Date().getFullYear()} KALLOS. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-foreground/40 hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-foreground/40 hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
