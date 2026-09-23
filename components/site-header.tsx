import Link from "next/link";
import { DEPARTEMEN } from "@/lib/data";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="group">
          <span className="block text-[13px] text-muted">
            PT Bosowa Berlian Motor — Cabang KIMA
          </span>
          <span className="block text-lg font-semibold tracking-tight text-ink group-hover:text-part">
            Rekap Pembelian Suku Cadang
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-slate hover:bg-surface hover:text-ink"
          >
            Ringkasan
          </Link>
          {(Object.keys(DEPARTEMEN) as Array<keyof typeof DEPARTEMEN>).map(
            (kunci) => (
              <Link
                key={kunci}
                href={DEPARTEMEN[kunci].jalur}
                className="rounded-md px-3 py-2 text-slate hover:bg-surface hover:text-ink"
              >
                {DEPARTEMEN[kunci].nama}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
