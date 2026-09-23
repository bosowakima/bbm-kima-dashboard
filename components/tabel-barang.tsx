import Link from "next/link";
import { BarisRekap } from "@/lib/data";
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
  const totalHalaman = Math.max(1, Math.ceil(jumlah / perHalaman));
  const awal = jumlah === 0 ? 0 : (halaman - 1) * perHalaman + 1;
  const akhir = Math.min(halaman * perHalaman, jumlah);

  return (
    <div>
      <form
        action={jalur}
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

      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] border-collapse bg-panel text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-muted">
              {KOLOM.map((kolom) => {
                const aktif = urut === kolom.kunci;
                const arahBaru = aktif && arah === "desc" ? "asc" : "desc";
                return (
                  <th
                    key={kolom.kunci}
                    scope="col"
                    className={`px-4 py-3 font-medium ${kolom.rata}`}
                  >
                    <Link
                      href={buatUrl(
                        jalur,
                        { urut: kolom.kunci, arah: arahBaru, halaman: undefined },
                        kini
                      )}
                      className={`hover:text-ink ${aktif ? "text-ink" : ""}`}
                    >
                      {kolom.label}
                      {aktif ? (arah === "desc" ? " ↓" : " ↑") : ""}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td colSpan={KOLOM.length} className="px-4 py-10 text-center text-muted">
                  Tidak ada barang yang cocok dengan pencarian ini. Coba kata
                  kunci yang lebih pendek.
                </td>
              </tr>
            ) : (
              baris.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-[13px] text-slate">
                    {item.no_part}
                  </td>
                  <td className="px-4 py-3 text-ink">{item.nama_barang}</td>
                  <td className="tabular px-4 py-3 text-right text-ink">
                    {formatRupiah(item.harga_satuan)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-slate">
                    {formatAngka(item.frekuensi)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-slate">
                    {formatAngka(item.frekuensi_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
        <span className="tabular">
          Menampilkan {formatAngka(awal)}–{formatAngka(akhir)} dari{" "}
          {formatAngka(jumlah)} baris
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={buatUrl(jalur, { halaman: Math.max(1, halaman - 1) }, kini)}
            aria-disabled={halaman <= 1}
            className={`rounded-md border border-line px-3 py-2 ${
              halaman <= 1
                ? "pointer-events-none text-muted opacity-50"
                : "hover:bg-surface"
            }`}
          >
            Sebelumnya
          </Link>
          <span className="tabular text-muted">
            Halaman {halaman} dari {totalHalaman}
          </span>
          <Link
            href={buatUrl(
              jalur,
              { halaman: Math.min(totalHalaman, halaman + 1) },
              kini
            )}
            aria-disabled={halaman >= totalHalaman}
            className={`rounded-md border border-line px-3 py-2 ${
              halaman >= totalHalaman
                ? "pointer-events-none text-muted opacity-50"
                : "hover:bg-surface"
            }`}
          >
            Berikutnya
          </Link>
        </div>
      </div>
    </div>
  );
}
