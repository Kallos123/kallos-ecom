"use client";

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { Suspense } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') || undefined;
  const sortBy = searchParams.get('sort') || undefined;

  // Fetch categories to map slug → id for the API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });

  const categoryId = categorySlug
    ? categories.find(c => c.slug === categorySlug)?.id
    : undefined;

  const { data: products = [], isLoading } = useQuery<ProductCardData[]>({
    queryKey: ['products', { categorySlug, sortBy }],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '48' });
      if (categoryId) params.set('category', categoryId);
      if (sortBy) params.set('sortBy', sortBy);
      return api.get<ProductCardData[]>(`/products?${params}`);
    },
    // Wait until categories are resolved when a category filter is active
    enabled: !categorySlug || categories.length > 0,
  });

  const categoryName = categorySlug
    ? categories.find(c => c.slug === categorySlug)?.name ?? categorySlug
    : undefined;

  const title = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : 'Shop All';

  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <p className="text-xs tracking-[0.4em] text-kallos-crimson mb-4 uppercase">
            {categoryName || 'All Products'}
          </p>
          <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-foreground tracking-wide">
            {title}
          </h1>
        </div>

        <ShopFilters currentCategory={categorySlug} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mt-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-3/4 bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mt-12">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ShopPage() {
  return (
    <main className="bg-background min-h-screen">
      <Header />
      <Suspense fallback={null}>
        <ShopContent />
      </Suspense>
      <Footer />
    </main>
  );
}
