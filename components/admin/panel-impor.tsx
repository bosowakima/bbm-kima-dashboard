"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Departemen } from "@/lib/barang";
import { tampilTanggal } from "@/lib/kelompok";

type Pratinjau = {
  sheet: Array<{ nama: string; adaKolomFrekuensi: boolean; adaTanggal: boolean; jumlahBaris: number }>;
  terpilih: string[];
  jumlahBaris: number;
  jumlahPembelian: number;
  jumlahNota: number;
  jumlahNotaTanpaTanggal: number;
  contoh: Array<{
    no_part: string;
    nama_barang: string;
    harga_satuan: number;
    frekuensi: number;
    nota: Array<{ tanggal_nota: string | null }>;
  }>;
  peringatan: string[];
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const angka = new Intl.NumberFormat("id-ID");

export default function PanelImpor({ departemen, namaDepartemen }: { departemen: Departemen; namaDepartemen: string }) {
  const router = useRouter();
  const inputBerkas = useRef<HTMLInputElement>(null);
  const [berkas, setBerkas] = useState<File | null>(null);
  const [mode, setMode] = useState<"ganti" | "tambah">("ganti");
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [pratinjau, setPratinjau] = useState<Pratinjau | null>(null);
  const [proses, setProses] = useState<"diam" | "memeriksa" | "menerapkan">("diam");
  const [galat, setGalat] = useState<string | null>(null);
  const [selesai, setSelesai] = useState<string | null>(null);

  async function kirim(tahap: "periksa" | "terapkan", sheet?: string[]) {
    if (!berkas) return null;
    const form = new FormData();
    form.set("berkas", berkas);
    form.set("departemen", departemen);
    form.set("tahap", tahap);
    form.set("mode", mode);
    (sheet ?? []).forEach((s) => form.append("sheet", s));
    const res = await fetch("/api/admin/import", { method: "POST", body: form });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return null;
    }
    const data = await res.json().catch(() => ({ pesan: `Permintaan gagal (kode ${res.status}).` }));
    if (!res.ok) throw new Error(data.pesan);
    return data;
  }

  async function periksa(sheet?: string[]) {
    setGalat(null);
    setSelesai(null);
    setProses("memeriksa");
    try {
      const data = (await kirim("periksa", sheet)) as Pratinjau | null;
      if (data) {
        setPratinjau(data);
        setTerpilih(data.terpilih);
      }
    } catch (e) {
      setPratinjau(null);
      setGalat((e as Error).message);
    } finally {
      setProses("diam");
    }
  }

  async function terapkan() {
    if (!pratinjau) return;
    const kalimat =
      mode === "ganti"
        ? `Seluruh data ${namaDepartemen} saat ini akan diganti dengan ${angka.format(pratinjau.jumlahBaris)} baris dari berkas. Lanjutkan?`
        : `${angka.format(pratinjau.jumlahBaris)} baris akan digabungkan ke data ${namaDepartemen}. Frekuensi barang yang sudah ada akan bertambah. Lanjutkan?`;
    if (!window.confirm(kalimat)) return;

    setGalat(null);
    setProses("menerapkan");
    try {
      const data = await kirim("terapkan", terpilih);
      if (data) {
        setSelesai(
          mode === "ganti"
            ? `Impor selesai. Data ${namaDepartemen} kini berisi ${angka.format(data.jumlahBaris)} baris dan ${angka.format(data.jumlahNota)} tanggal nota dari berkas ${berkas?.name}.`
            : `Impor selesai. ${angka.format(data.barisBaru)} barang baru ditambahkan, sisanya menambah frekuensi barang yang sudah ada.`
        );
        setPratinjau(null);
        setBerkas(null);
        if (inputBerkas.current) inputBerkas.current.value = "";
        router.refresh();
      }
    } catch (e) {
      setGalat((e as Error).message);
    } finally {
      setProses("diam");
    }
  }

  function ubahSheet(nama: string, centang: boolean) {
    const baru = centang ? [...terpilih, nama] : terpilih.filter((s) => s !== nama);
    setTerpilih(baru);
    if (baru.length > 0) periksa(baru);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-slate">Berkas Excel (.xlsx)</span>
          <input
            ref={inputBerkas}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setBerkas(e.target.files?.[0] ?? null);
              setPratinjau(null);
              setGalat(null);
              setSelesai(null);
            }}
            className="mt-1 block text-sm text-ink file:mr-3 file:h-9 file:rounded-md file:border file:border-line file:bg-panel file:px-3 file:text-sm file:text-ink hover:file:bg-surface"
          />
        </label>

        <fieldset className="text-sm">
          <legend className="text-slate">Cara impor</legend>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === "ganti"} onChange={() => setMode("ganti")} />
              Ganti seluruh data
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === "tambah"} onChange={() => setMode("tambah")} />
              Tambahkan ke data yang ada
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          disabled={!berkas || proses !== "diam"}
          onClick={() => periksa()}
          className="h-9 rounded-md border border-line bg-panel px-4 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50"
        >
          {proses === "memeriksa" ? "Memeriksa berkas…" : "Periksa berkas"}
        </button>
      </div>

      <p className="max-w-3xl text-[13px] text-muted">
        Berkas hasil ekspor dashboard (termasuk berkas data awal) dibaca lengkap dengan tanggal notanya. Sheet
        rekap bulanan juga dapat diimpor: setiap baris dihitung satu kali pembelian dan tanggal diambil dari kolom
        TGL. NOTA, tetapi warna sel tidak ikut dibaca. Sheet analisis tanpa kolom tanggal diimpor tanpa tanggal
        nota. Frekuensi total selalu dihitung ulang otomatis.
      </p>

      {galat ? <p role="alert" className="text-sm text-part">{galat}</p> : null}
      {selesai ? <p role="status" className="text-sm text-slate">{selesai}</p> : null}

      {pratinjau ? (
        <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <div>
            <p className="text-sm font-medium text-ink">Sheet yang ditemukan</p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {pratinjau.sheet.map((s) => (
                <li key={s.nama}>
                  <label className="flex items-center gap-2 text-sm text-slate">
                    <input
                      type="checkbox"
                      checked={terpilih.includes(s.nama)}
                      disabled={proses !== "diam"}
                      onChange={(e) => ubahSheet(s.nama, e.target.checked)}
                    />
                    <span className="text-ink">{s.nama}</span>
                    <span className="tabular text-muted">
                      {angka.format(s.jumlahBaris)} baris{s.adaKolomFrekuensi ? ", berkolom frekuensi" : ""}
                      {s.adaTanggal ? ", bertanggal nota" : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <p className="tabular text-sm text-ink">
            Siap diimpor: {angka.format(pratinjau.jumlahBaris)} barang pada harga masing-masing, dengan total{" "}
            {angka.format(pratinjau.jumlahPembelian)} kali pembelian
            {pratinjau.jumlahNota > 0
              ? ` dan ${angka.format(pratinjau.jumlahNota)} tanggal nota${
                  pratinjau.jumlahNotaTanpaTanggal > 0
                    ? ` (${angka.format(pratinjau.jumlahNotaTanpaTanggal)} di antaranya tanpa tanggal yang terbaca)`
                    : ""
                }`
              : ". Berkas ini tidak memuat tanggal nota"}
            .
          </p>

          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[640px] bg-panel text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-3 py-2 font-medium">No. part</th>
                  <th className="px-3 py-2 font-medium">Nama barang</th>
                  <th className="px-3 py-2 text-right font-medium">Harga satuan</th>
                  <th className="px-3 py-2 text-right font-medium">Frekuensi</th>
                  <th className="px-3 py-2 font-medium">Nota terakhir</th>
                </tr>
              </thead>
              <tbody>
                {pratinjau.contoh.map((b, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-mono text-slate">{b.no_part}</td>
                    <td className="px-3 py-2 text-ink">{b.nama_barang}</td>
                    <td className="tabular px-3 py-2 text-right">{rupiah.format(b.harga_satuan)}</td>
                    <td className="tabular px-3 py-2 text-right">{angka.format(b.frekuensi)}</td>
                    <td className="tabular px-3 py-2 text-slate">
                      {b.nota[0]?.tanggal_nota ? tampilTanggal(b.nota[0].tanggal_nota) : "—"}
                      {b.nota.length > 1 ? ` · ${b.nota.length} nota` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-muted">Menampilkan {pratinjau.contoh.length} contoh pertama.</p>

          {pratinjau.peringatan.length > 0 ? (
            <details className="text-[13px] text-slate">
              <summary className="cursor-pointer">{pratinjau.peringatan.length} baris dilewati karena datanya tidak lengkap</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {pratinjau.peringatan.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </details>
          ) : null}

          <button
            type="button"
            onClick={terapkan}
            disabled={proses !== "diam" || terpilih.length === 0}
            className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-slate disabled:opacity-50"
          >
            {proses === "menerapkan"
              ? "Menyimpan ke basis data…"
              : mode === "ganti"
              ? "Ganti data dengan isi berkas"
              : "Tambahkan isi berkas"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
