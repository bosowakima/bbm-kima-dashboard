import Link from "next/link";
import { ambilBarangTeratas, ambilRingkasan, DEPARTEMEN, Departemen, Ringkasan } from "@/lib/data";
import { supabaseSiap } from "@/lib/supabase";
import KartuRingkasan from "@/components/kartu-ringkasan";
import TanggaFrekuensi from "@/components/tangga-frekuensi";
import PemberitahuanSetup from "@/components/pemberitahuan-setup";
import { Panel } from "@/components/panel";

export const revalidate = 300;

const WARNA: Record<Departemen, string> = {
  sparepart: "#C8102E",
  service: "#24618F",
};

const KOSONG: Ringkasan = {
  departemen: "sparepart",
  jumlah_baris: 0,
  jumlah_barang: 0,
  jumlah_pembelian: 0,
  estimasi_nilai: 0,
};

export default async function Halaman() {
  if (!supabaseSiap) return <PemberitahuanSetup />;

  const [ringkasan, topSparepart, topService] = await Promise.all([
    ambilRingkasan(),
    ambilBarangTeratas("sparepart", 8),
    ambilBarangTeratas("service", 8),
  ]);

  const perDepartemen = (dep: Departemen): Ringkasan =>
    ringkasan.find((r) => r.departemen === dep) ?? { ...KOSONG, departemen: dep };

  const top: Record<Departemen, typeof topSparepart> = {
    sparepart: topSparepart,
    service: topService,
  };

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Barang apa yang paling sering dibeli bengkel
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">
          Ringkasan pembelian suku cadang pada dua departemen, Januari sampai
          Agustus 2026. Angka disusun dari rekap nota yang sudah dibersihkan dari
          pencatatan ganda, sehingga satu baris mewakili satu barang pada satu
          harga satuan.
        </p>
      </div>

      {(Object.keys(DEPARTEMEN) as Departemen[]).map((dep) => (
        <section key={dep} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: WARNA[dep] }}
                  aria-hidden
                />
                Departemen {DEPARTEMEN[dep].nama}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                {DEPARTEMEN[dep].sumber}
              </p>
            </div>
            <Link
              href={DEPARTEMEN[dep].jalur}
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Lihat daftar lengkap
            </Link>
          </div>

          <KartuRingkasan data={perDepartemen(dep)} warna={WARNA[dep]} />

          <Panel
            judul="Delapan barang paling sering dibeli"
            keterangan="Frekuensi menggabungkan seluruh varian harga untuk barang yang sama."
          >
            <TanggaFrekuensi data={top[dep]} warna={WARNA[dep]} />
          </Panel>
        </section>
      ))}
    </div>
  );
}
