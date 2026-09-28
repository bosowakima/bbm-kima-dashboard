import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilTabel, ambilRingkasan, DEPARTEMEN } from "@/lib/data";
import { departemenSah, DAFTAR_DEPARTEMEN } from "@/lib/barang";
import { supabaseSiap } from "@/lib/supabase";
import { formatAngka } from "@/lib/format";
import { Panel } from "@/components/panel";
import PemberitahuanSetup from "@/components/pemberitahuan-setup";
import TabelAdmin from "@/components/admin/tabel-admin";
import Paginasi from "@/components/paginasi";
import PanelImpor from "@/components/admin/panel-impor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Rekap Pembelian BBM KIMA" };

const PER_HALAMAN = 50;

export default async function Halaman({
  params,
  searchParams,
}: {
  params: { departemen: string };
  searchParams: { cari?: string; halaman?: string };
}) {
  if (!departemenSah(params.departemen)) notFound();
  if (!supabaseSiap) return <PemberitahuanSetup />;

  const departemen = params.departemen;
  const info = DEPARTEMEN[departemen];
  const cari = searchParams.cari ?? "";
  const halaman = Number(searchParams.halaman) > 0 ? Number(searchParams.halaman) : 1;

  const [tabel, ringkasan] = await Promise.all([
    ambilTabel({ departemen, cari, urut: "no_urut", arah: "asc", halaman, perHalaman: PER_HALAMAN }),
    ambilRingkasan(),
  ]);
  const jumlahSemua = ringkasan.find((r) => r.departemen === departemen)?.jumlah_baris ?? 0;
  const jalur = `/admin/${departemen}`;
  const url = (h: number) => {
    const p = new URLSearchParams();
    if (cari) p.set("cari", cari);
    if (h > 1) p.set("halaman", String(h));
    const q = p.toString();
    return q ? `${jalur}?${q}` : jalur;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Kelola data {info.nama}</h1>
          <p className="tabular mt-2 text-sm text-slate">
            {formatAngka(jumlahSemua)} baris tersimpan. Perubahan langsung tampil di halaman publik.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Pilih departemen" className="flex rounded-md border border-line bg-panel p-0.5 text-sm">
            {DAFTAR_DEPARTEMEN.map((d) => (
              <Link
                key={d}
                href={`/admin/${d}`}
                aria-current={d === departemen ? "page" : undefined}
                className={`rounded px-3 py-1.5 ${d === departemen ? "bg-ink text-white" : "text-slate hover:text-ink"}`}
              >
                {DEPARTEMEN[d].nama}
              </Link>
            ))}
          </nav>
          <a
            href={`/api/admin/export?departemen=${departemen}`}
            className="h-9 rounded-md border border-line bg-panel px-4 text-sm font-medium leading-9 text-ink hover:bg-surface"
          >
            Ekspor ke Excel
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="h-9 rounded-md px-3 text-sm text-muted hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </div>

      <Panel
        judul="Impor dari Excel"
        keterangan="Periksa berkas lebih dahulu. Data baru tersimpan setelah Anda menekan tombol simpan pada pratinjau."
      >
        <PanelImpor departemen={departemen} namaDepartemen={info.nama} />
      </Panel>

      <div id="data-barang" className="scroll-mt-4">
      <Panel judul="Data barang" keterangan="Frekuensi total dan urutan dihitung ulang otomatis setiap kali data berubah.">
        <form action={`${jalur}#data-barang`} method="get" className="mb-4 flex flex-wrap items-center gap-2">
          <label htmlFor="cari-admin" className="sr-only">Cari nama barang atau nomor part</label>
          <input
            id="cari-admin"
            name="cari"
            defaultValue={cari}
            placeholder="Cari nama barang atau nomor part"
            className="h-10 w-full max-w-sm rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-muted"
          />
          <button type="submit" className="h-10 rounded-md border border-line bg-panel px-4 text-sm font-medium text-ink hover:bg-surface">
            Cari
          </button>
          {cari ? (
            <Link href={jalur} className="h-10 px-2 text-sm leading-10 text-slate hover:text-ink">Hapus pencarian</Link>
          ) : null}
        </form>

        <TabelAdmin departemen={departemen} baris={tabel.baris} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="tabular text-sm text-slate">
            {formatAngka(tabel.jumlah)} baris{cari ? " cocok" : ""}, halaman {tabel.halaman} dari {tabel.totalHalaman}
          </span>
          <Paginasi
            halaman={tabel.halaman}
            totalHalaman={tabel.totalHalaman}
            hrefHalaman={url}
            jalur={jalur}
            paramLain={{ cari: cari || undefined }}
            jangkar="data-barang"
          />
        </div>
      </Panel>
      </div>
    </div>
  );
}
