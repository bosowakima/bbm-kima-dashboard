import {
  ambilBarangTeratas,
  ambilRingkasan,
  ambilTabel,
  DEPARTEMEN,
  Departemen,
  Ringkasan,
} from "@/lib/data";
import { supabaseSiap } from "@/lib/supabase";
import KartuRingkasan from "@/components/kartu-ringkasan";
import TanggaFrekuensi from "@/components/tangga-frekuensi";
import TabelBarang from "@/components/tabel-barang";
import PemberitahuanSetup from "@/components/pemberitahuan-setup";
import { Panel } from "@/components/panel";

const WARNA: Record<Departemen, string> = {
  sparepart: "#C8102E",
  service: "#24618F",
};

const PER_HALAMAN = 25;

export type ParamHalaman = {
  cari?: string;
  urut?: string;
  arah?: string;
  halaman?: string;
};

export default async function HalamanDepartemen({
  departemen,
  searchParams,
}: {
  departemen: Departemen;
  searchParams: ParamHalaman;
}) {
  if (!supabaseSiap) return <PemberitahuanSetup />;

  const cari = searchParams.cari ?? "";
  const urut = searchParams.urut ?? "frekuensi_total";
  const arah = searchParams.arah === "asc" ? "asc" : "desc";
  const halaman = Number(searchParams.halaman) > 0 ? Number(searchParams.halaman) : 1;

  const [ringkasan, teratas, tabel] = await Promise.all([
    ambilRingkasan(),
    ambilBarangTeratas(departemen, 5),
    ambilTabel({ departemen, cari, urut, arah, halaman, perHalaman: PER_HALAMAN }),
  ]);

  const data: Ringkasan =
    ringkasan.find((r) => r.departemen === departemen) ?? {
      departemen,
      jumlah_baris: 0,
      jumlah_barang: 0,
      jumlah_pembelian: 0,
      estimasi_nilai: 0,
    };

  const info = DEPARTEMEN[departemen];

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {info.ringkas}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">{info.sumber}</p>
      </div>

      <KartuRingkasan data={data} warna={WARNA[departemen]} />

      <Panel
        judul="Lima barang paling sering dibeli"
        keterangan="Rentang harga muncul bila barang yang sama pernah dibeli pada harga berbeda."
      >
        <TanggaFrekuensi data={teratas} warna={WARNA[departemen]} />
      </Panel>

      <Panel
        judul="Daftar lengkap"
        keterangan="Klik judul kolom untuk mengurutkan. Pencarian mencakup nama barang dan nomor part."
      >
        <TabelBarang
          jalur={info.jalur}
          baris={tabel.baris}
          jumlah={tabel.jumlah}
          halaman={halaman}
          perHalaman={PER_HALAMAN}
          cari={cari}
          urut={urut}
          arah={arah}
        />
      </Panel>
    </div>
  );
}
