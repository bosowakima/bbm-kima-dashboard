import { formatAngka, formatRupiahSingkat } from "@/lib/format";
import { Ringkasan } from "@/lib/data";

export default function KartuRingkasan({
  data,
  warna,
}: {
  data: Ringkasan;
  warna: string;
}) {
  const butir = [
    { label: "Barang unik", nilai: formatAngka(data.jumlah_barang) },
    { label: "Baris daftar", nilai: formatAngka(data.jumlah_baris) },
    { label: "Kali pembelian", nilai: formatAngka(data.jumlah_pembelian) },
    { label: "Estimasi nilai", nilai: formatRupiahSingkat(data.estimasi_nilai) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {butir.map((b) => (
        <div key={b.label} className="bg-panel px-4 py-4">
          <dt className="text-[13px] text-muted">{b.label}</dt>
          <dd
            className="tabular mt-1 text-xl font-semibold"
            style={{ color: warna }}
          >
            {b.nilai}
          </dd>
        </div>
      ))}
    </dl>
  );
}
