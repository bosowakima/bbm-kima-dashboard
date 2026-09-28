import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-bosowa-berlian-motor.png";
import { DEPARTEMEN } from "@/lib/departemen";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="group flex items-center gap-4">
          <Image
            src={logo}
            alt="Bosowa Berlian Motor"
            priority
            unoptimized
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <span className="h-9 w-px shrink-0 bg-line sm:h-10" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[13px] text-muted">Cabang KIMA</span>
            <span className="block text-lg font-semibold leading-tight tracking-tight text-ink group-hover:text-part">
              Rekap Pembelian Suku Cadang
            </span>
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
          <Link
            href="/admin"
            className="ml-1 rounded-md border border-line px-3 py-2 text-slate hover:bg-surface hover:text-ink"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
