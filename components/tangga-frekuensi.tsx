import { BarangRingkas } from "@/lib/data";
import { formatAngka, formatRupiah } from "@/lib/format";

/**
 * Menampilkan barang paling sering dibeli sebagai batang horizontal.
 * Panjang batang sebanding dengan frekuensi tertinggi pada daftar.
 */
export default function TanggaFrekuensi({
  data,
  warna,
}: {
  data: BarangRingkas[];
  warna: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted">
        Belum ada data untuk ditampilkan. Pastikan tabel di Supabase sudah diisi
        melalui berkas seed.
      </p>
    );
  }

  const tertinggi = data[0]?.frekuensi_total ?? 1;

  return (
    <ol className="space-y-3">
      {data.map((barang) => {
        const lebar = Math.max(6, (barang.frekuensi_total / tertinggi) * 100);
        const rentangHarga =
          barang.harga_min === barang.harga_max
            ? formatRupiah(barang.harga_min)
            : `${formatRupiah(barang.harga_min)} – ${formatRupiah(barang.harga_max)}`;

        return (
          <li key={`${barang.no_part}-${barang.nama_barang}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-ink">
                {barang.nama_barang}
              </span>
              <span className="tabular text-sm text-slate">
                {formatAngka(barang.frekuensi_total)} kali
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-surface">
              <div
                className="h-2 rounded-full"
                style={{ width: `${lebar}%`, backgroundColor: warna }}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[13px] text-muted">
              <span className="font-mono">{barang.no_part}</span>
              <span className="tabular">
                {rentangHarga}
                {barang.varian_harga > 1
                  ? ` · ${barang.varian_harga} varian harga`
                  : ""}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
