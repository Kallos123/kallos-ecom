import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "KALLOS Admin",
  description: "KALLOS administration panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.88 0.008 65)",
              color: "oklch(0.18 0.010 65)",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
