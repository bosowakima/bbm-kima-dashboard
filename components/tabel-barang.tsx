import Link from "next/link";
import Paginasi from "@/components/paginasi";
import type { BarisRekap } from "@/lib/barang";
import TabelRekapPublik, { type JudulKolom } from "@/components/rekap/tabel-rekap-publik";
import { formatAngka, formatRupiah } from "@/lib/format";

type Props = {
  jalur: string;
  baris: BarisRekap[];
  jumlah: number;
  halaman: number;
  perHalaman: number;
  cari: string;
  urut: string;
  arah: "asc" | "desc";
};

const KOLOM: Array<{ kunci: string; label: string; rata: string }> = [
  { kunci: "no_part", label: "No. part", rata: "text-left" },
  { kunci: "nama_barang", label: "Nama barang", rata: "text-left" },
  { kunci: "harga_satuan", label: "Harga satuan", rata: "text-right" },
  { kunci: "frekuensi", label: "Frekuensi", rata: "text-right" },
  { kunci: "frekuensi_total", label: "Frekuensi total", rata: "text-right" },
];

function buatUrl(
  jalur: string,
  ubah: Record<string, string | number | undefined>,
  kini: Record<string, string | number>
) {
  const params = new URLSearchParams();
  const gabungan = { ...kini, ...ubah };
  Object.entries(gabungan).forEach(([kunci, nilai]) => {
    if (nilai === undefined || nilai === "" || nilai === null) return;
    params.set(kunci, String(nilai));
  });
  const kueri = params.toString();
  return kueri ? `${jalur}?${kueri}` : jalur;
}

export default function TabelBarang({
  jalur,
  baris,
  jumlah,
  halaman,
  perHalaman,
  cari,
  urut,
  arah,
}: Props) {
  const kini = { cari, urut, arah, halaman };
  const judul: JudulKolom[] = KOLOM.map((kolom) => {
    const aktif = urut === kolom.kunci;
    const arahBaru = aktif && arah === "desc" ? "asc" : "desc";
    return {
      kunci: kolom.kunci,
      label: kolom.label,
      rata: kolom.rata as JudulKolom["rata"],
      aktif,
      arah,
      href: buatUrl(jalur, { urut: kolom.kunci, arah: arahBaru, halaman: undefined }, kini),
    };
  });
  const totalHalaman = Math.max(1, Math.ceil(jumlah / perHalaman));
  const awal = jumlah === 0 ? 0 : (halaman - 1) * perHalaman + 1;
  const akhir = Math.min(halaman * perHalaman, jumlah);

  return (
    <div>
      <form
        action={`${jalur}#daftar`}
        method="get"
        className="flex flex-wrap items-center gap-2"
      >
        <label htmlFor="cari" className="sr-only">
          Cari nama barang atau nomor part
        </label>
        <input
          id="cari"
          name="cari"
          defaultValue={cari}
          placeholder="Cari nama barang atau nomor part"
          className="h-10 w-full max-w-sm rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-muted"
        />
        <input type="hidden" name="urut" value={urut} />
        <input type="hidden" name="arah" value={arah} />
        <button
          type="submit"
          className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-slate"
        >
          Cari
        </button>
        {cari ? (
          <Link
            href={buatUrl(jalur, { cari: undefined, halaman: undefined }, kini)}
            className="h-10 rounded-md border border-line px-4 text-sm leading-10 text-slate hover:bg-surface"
          >
            Hapus pencarian
          </Link>
        ) : null}
      </form>

      <p className="mt-3 text-[13px] text-muted">
        Warna latar yang sama menandai barang yang sama pada harga berbeda. Klik panah atau nama barang
        untuk melihat seluruh tanggal nota.
      </p>
      <TabelRekapPublik baris={baris} judul={judul} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="tabular text-sm text-slate">
          Menampilkan {formatAngka(awal)}–{formatAngka(akhir)} dari {formatAngka(jumlah)} baris
        </span>
        <Paginasi
          halaman={halaman}
          totalHalaman={totalHalaman}
          hrefHalaman={(n) => buatUrl(jalur, { halaman: n > 1 ? n : undefined }, kini)}
          jalur={jalur}
          paramLain={{ cari: cari || undefined, urut, arah }}
          jangkar="daftar"
        />
      </div>
    </div>
  );
}
