import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { EditorialSection } from '@/components/home/EditorialSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CTASection } from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <main className="relative bg-background min-h-screen">
      <Header />
      <HeroSection />
      <FeaturedProducts />
      <CategoriesSection />
      <EditorialSection />
      <CTASection />
      <Footer />
    </main>
  );
}
