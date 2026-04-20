"use client";

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: products = [], isLoading } = useQuery<ProductCardData[]>({
    queryKey: ['products', 'search', query],
    queryFn: () => {
      const params = new URLSearchParams({ search: query, limit: '20' });
      return api.get<ProductCardData[]>(`/products?${params}`);
    },
    enabled: query.length >= 2,
  });

  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <p className="text-xs tracking-[0.4em] text-kallos-gold mb-4 uppercase">
            Search Results
          </p>
          <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-kallos-ivory tracking-wide">
            &quot;{query}&quot;
          </h1>
          {!isLoading && query.length >= 2 && (
            <p className="text-kallos-warm-grey mt-4">
              {products.length} {products.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        {query.length < 2 ? (
          <div className="text-center py-20">
            <p className="text-kallos-warm-grey text-lg">Enter at least 2 characters to search</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-kallos-charcoal animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-kallos-warm-grey text-lg mb-4">No products found</p>
            <p className="text-kallos-warm-grey/60 text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <main className="bg-kallos-black min-h-screen">
      <Header />
      <Suspense fallback={null}>
        <SearchContent />
      </Suspense>
      <Footer />
    </main>
  );
}
