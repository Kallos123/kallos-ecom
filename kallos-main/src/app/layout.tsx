import type { Metadata } from "next";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "KALLOS | Luxury Fashion",
  description:
    "Discover refined luxury fashion. Timeless elegance, artisan craftsmanship, and understated sophistication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <LenisProvider>{children}</LenisProvider>
        </Providers>
      </body>
    </html>
  );
}
