import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

const collections = [
  {
    title: 'New In',
    description: 'The latest arrivals and freshly released silhouettes.',
    href: '/shop?sort=newest',
    eyebrow: 'Latest',
  },
  {
    title: 'Clothing Edit',
    description: 'Structured essentials and signature wardrobe layers.',
    href: '/shop?category=Clothing',
    eyebrow: 'Wardrobe',
  },
  {
    title: 'Accessories Edit',
    description: 'Jewelry, bags, and details that finish the look with intention.',
    href: '/shop?category=Accessories',
    eyebrow: 'Finish',
  },
];

export default function CollectionsPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header />
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl border-b border-border pb-12 mb-14">
            <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-4">Collections</p>
            <h1 className="font-editorial text-4xl md:text-6xl text-foreground mb-6">Curated Entry Points</h1>
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed">
              Start from the edit that matches your mood, then move deeper into the full collection.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.title}
                href={collection.href}
                className="group border border-border bg-card/70 px-6 py-8 transition-colors hover:border-kallos-gold/40"
              >
                <p className="text-[10px] tracking-[0.3em] uppercase text-kallos-gold mb-4">{collection.eyebrow}</p>
                <h2 className="text-foreground text-2xl mb-4">{collection.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">{collection.description}</p>
                <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground group-hover:text-kallos-gold transition-colors">
                  Explore collection
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}