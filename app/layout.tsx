import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Rekap Pembelian — Bosowa Berlian Motor KIMA",
  description:
    "Dashboard rekap pembelian sparepart dan service Bosowa Berlian Motor KIMA periode Januari sampai Agustus 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
          {children}
        </main>
        <footer className="border-t border-line bg-panel">
          <div className="mx-auto w-full max-w-6xl px-5 py-6 text-sm text-muted sm:px-8">
            Data berasal dari rekap nota Toko Intan Motor untuk PT Bosowa Berlian
            Motor KIMA, periode Januari sampai Agustus 2026.
          </div>
        </footer>
      </body>
    </html>
  );
}
