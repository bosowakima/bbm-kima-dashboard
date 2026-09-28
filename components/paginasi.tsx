import Link from "next/link";

type Props = {
  halaman: number;
  totalHalaman: number;
  /** Alamat halaman ke-n, lengkap dengan pencarian dan urutan yang sedang aktif. */
  hrefHalaman: (n: number) => string;
  /** Alamat tujuan formulir "Ke halaman", tanpa parameter. */
  jalur: string;
  /** Parameter lain yang ikut dikirim bersama nomor halaman (cari, urut, arah). */
  paramLain: Record<string, string | undefined>;
  /** Id elemen yang dituju setelah pindah halaman, agar layar langsung di daftar. */
  jangkar?: string;
};

/** Nomor yang ditampilkan: 1, halaman di sekitar posisi sekarang, dan halaman terakhir. */
function daftarNomor(kini: number, total: number): Array<number | "…"> {
  const tampil = new Set([1, total, kini - 1, kini, kini + 1]);
  if (kini <= 3) [2, 3, 4].forEach((n) => tampil.add(n));
  if (kini >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => tampil.add(n));
  const urut = Array.from(tampil).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const hasil: Array<number | "…"> = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push("…");
    hasil.push(n);
  });
  return hasil;
}

export default function Paginasi({ halaman, totalHalaman, hrefHalaman, jalur, paramLain, jangkar }: Props) {
  if (totalHalaman <= 1) return null;

  const hash = jangkar ? `#${jangkar}` : "";
  const tombol = "grid h-9 min-w-8 place-items-center rounded-md border px-2 text-sm sm:min-w-9 sm:px-2.5";
  const aktif = "border-ink bg-ink font-medium text-white";
  const biasa = "border-line bg-panel text-slate hover:bg-surface hover:text-ink";
  const mati = "pointer-events-none border-line bg-panel text-muted opacity-50";

  return (
    <nav aria-label="Pindah halaman daftar" className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-1">
        <Link
          href={hrefHalaman(Math.max(1, halaman - 1)) + hash}
          aria-disabled={halaman <= 1}
          tabIndex={halaman <= 1 ? -1 : undefined}
          aria-label="Halaman sebelumnya"
          className={`${tombol} ${halaman <= 1 ? mati : biasa}`}
        >
          <span aria-hidden className="sm:hidden">‹</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </Link>

        <ol className="flex items-center gap-1">
          {daftarNomor(halaman, totalHalaman).map((n, i) =>
            n === "…" ? (
              <li key={`jeda-${i}`} aria-hidden className="px-1 text-sm text-muted">
                …
              </li>
            ) : (
              <li key={n}>
                <Link
                  href={hrefHalaman(n) + hash}
                  aria-current={n === halaman ? "page" : undefined}
                  aria-label={`Halaman ${n}`}
                  className={`${tombol} tabular ${n === halaman ? aktif : biasa}`}
                >
                  {n}
                </Link>
              </li>
            )
          )}
        </ol>

        <Link
          href={hrefHalaman(Math.min(totalHalaman, halaman + 1)) + hash}
          aria-disabled={halaman >= totalHalaman}
          tabIndex={halaman >= totalHalaman ? -1 : undefined}
          aria-label="Halaman berikutnya"
          className={`${tombol} ${halaman >= totalHalaman ? mati : biasa}`}
        >
          <span aria-hidden className="sm:hidden">›</span>
          <span className="hidden sm:inline">Berikutnya</span>
        </Link>
      </div>

      <form action={jalur + hash} method="get" className="flex items-center gap-2 text-sm text-slate">
        {Object.entries(paramLain).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null
        )}
        <label htmlFor={`ke-halaman-${jalur}`}>Ke halaman</label>
        <input
          id={`ke-halaman-${jalur}`}
          name="halaman"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalHalaman}
          required
          placeholder={String(halaman)}
          className="tabular h-9 w-20 rounded-md border border-line bg-panel px-2 text-center text-sm text-ink"
        />
        <span className="tabular text-muted">dari {totalHalaman}</span>
        <button
          type="submit"
          className="h-9 rounded-md border border-line bg-panel px-3 font-medium text-ink hover:bg-surface"
        >
          Buka
        </button>
      </form>
    </nav>
  );
}
