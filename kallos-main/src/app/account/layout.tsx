"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import { User, ShoppingBag, MapPin, Wallet, RotateCcw, LogOut } from 'lucide-react';

const nav = [
  { label: 'Profile', href: '/account', icon: User, exact: true },
  { label: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Wallet', href: '/account/wallet', icon: Wallet },
  { label: 'Returns', href: '/account/returns', icon: RotateCcw },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <main className="bg-background min-h-screen">
        <Header />
        <div className="pt-40 text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <Header />
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Sidebar */}
            <aside className="lg:w-56 shrink-0">
              <div className="mb-8">
                <p className="font-editorial text-2xl text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{user.email}</p>
              </div>
              <nav className="space-y-1">
                {nav.map(({ label, href, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase transition-colors ${
                        isActive
                          ? 'text-foreground border-l border-kallos-crimson pl-3'
                          : 'text-muted-foreground hover:text-foreground border-l border-transparent pl-3'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors border-l border-transparent pl-3 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
