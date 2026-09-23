"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import SelEditable from "./sel-editable";
import type { Departemen } from "@/lib/barang";

export type BarisAdmin = {
  id: number;
  no_part: string;
  nama_barang: string;
  harga_satuan: number;
  frekuensi: number;
  frekuensi_total: number;
};

type Pesan = { jenis: "ok" | "galat"; teks: string } | null;

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const angka = new Intl.NumberFormat("id-ID");

async function kirim(url: string, method: string, isi?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: isi ? { "Content-Type": "application/json" } : undefined,
      body: isi ? JSON.stringify(isi) : undefined,
    });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return "Sesi admin berakhir.";
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.pesan ?? `Permintaan gagal (kode ${res.status}).`;
    }
    return null;
  } catch {
    return "Tidak dapat menghubungi server. Periksa koneksi internet, lalu coba lagi.";
  }
}

export default function TabelAdmin({ departemen, baris }: { departemen: Departemen; baris: BarisAdmin[] }) {
  const router = useRouter();
  const [pesan, setPesan] = useState<Pesan>(null);
  const [, mulai] = useTransition();
  const [baru, setBaru] = useState({ no_part: "", nama_barang: "", harga_satuan: "", frekuensi: "1" });
  const [menambah, setMenambah] = useState(false);

  function segarkan(teks: string) {
    setPesan({ jenis: "ok", teks });
    mulai(() => router.refresh());
  }

  async function ubahSel(id: number, kolom: keyof BarisAdmin, nilai: string, label: string) {
    const galat = await kirim(`/api/admin/barang/${id}`, "PATCH", { [kolom]: nilai });
    if (galat) {
      setPesan({ jenis: "galat", teks: galat });
      return galat;
    }
    segarkan(`${label} tersimpan.`);
    return null;
  }

  async function hapus(b: BarisAdmin) {
    const yakin = window.confirm(
      `Hapus ${b.nama_barang} (${rupiah.format(b.harga_satuan)})? Frekuensi total barang ini akan dihitung ulang.`
    );
    if (!yakin) return;
    const galat = await kirim(`/api/admin/barang/${b.id}`, "DELETE");
    if (galat) setPesan({ jenis: "galat", teks: galat });
    else segarkan(`${b.nama_barang} dihapus.`);
  }

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setMenambah(true);
    const galat = await kirim("/api/admin/barang", "POST", { departemen, ...baru });
    setMenambah(false);
    if (galat) {
      setPesan({ jenis: "galat", teks: galat });
      return;
    }
    setBaru({ no_part: "", nama_barang: "", harga_satuan: "", frekuensi: "1" });
    segarkan("Barang baru ditambahkan.");
  }

  const kelasInput = "h-9 w-full rounded-md border border-line bg-panel px-2 text-sm text-ink placeholder:text-muted";

  return (
    <div>
      <form onSubmit={tambah} className="grid gap-2 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_2fr_1fr_0.7fr_auto]">
        <input className={`${kelasInput} font-mono`} placeholder="No. part (boleh kosong)" aria-label="Nomor part barang baru"
          value={baru.no_part} onChange={(e) => setBaru({ ...baru, no_part: e.target.value })} />
        <input className={kelasInput} placeholder="Nama barang" aria-label="Nama barang baru" required
          value={baru.nama_barang} onChange={(e) => setBaru({ ...baru, nama_barang: e.target.value })} />
        <input className={`${kelasInput} text-right`} placeholder="Harga satuan" aria-label="Harga satuan barang baru" inputMode="numeric" required
          value={baru.harga_satuan} onChange={(e) => setBaru({ ...baru, harga_satuan: e.target.value })} />
        <input className={`${kelasInput} text-right`} placeholder="Frekuensi" aria-label="Frekuensi barang baru" inputMode="numeric" required
          value={baru.frekuensi} onChange={(e) => setBaru({ ...baru, frekuensi: e.target.value })} />
        <button type="submit" disabled={menambah}
          className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-slate disabled:opacity-60">
          {menambah ? "Menambahkan…" : "Tambah barang"}
        </button>
      </form>

      <div role="status" aria-live="polite" className="min-h-[2.25rem] pt-2 text-sm">
        {pesan ? (
          <p className={pesan.jenis === "galat" ? "text-part" : "text-slate"}>{pesan.teks}</p>
        ) : (
          <p className="text-muted">Klik sel mana pun untuk mengubahnya. Tekan Enter untuk menyimpan, Esc untuk batal.</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[820px] border-collapse bg-panel text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-muted">
              <th scope="col" className="w-[17%] px-4 py-3 font-medium">No. part</th>
              <th scope="col" className="px-4 py-3 font-medium">Nama barang</th>
              <th scope="col" className="w-[15%] px-4 py-3 text-right font-medium">Harga satuan</th>
              <th scope="col" className="w-[10%] px-4 py-3 text-right font-medium">Frekuensi</th>
              <th scope="col" className="w-[12%] px-4 py-3 text-right font-medium" title="Dihitung otomatis dari seluruh varian harga barang yang sama">
                Frekuensi total
              </th>
              <th scope="col" className="w-[7%] px-4 py-3"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Belum ada barang yang cocok. Tambahkan barang di atas, atau impor dari Excel.
                </td>
              </tr>
            ) : (
              baris.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 text-slate">
                    <SelEditable nilai={b.no_part} tampil={b.no_part} jenis="teks" mono label="nomor part"
                      simpan={(v) => ubahSel(b.id, "no_part", v, "Nomor part")} />
                  </td>
                  <td className="px-4 py-2 text-ink">
                    <SelEditable nilai={b.nama_barang} tampil={b.nama_barang} jenis="teks" label="nama barang"
                      simpan={(v) => ubahSel(b.id, "nama_barang", v, "Nama barang")} />
                  </td>
                  <td className="tabular px-4 py-2 text-ink">
                    <SelEditable nilai={b.harga_satuan} tampil={rupiah.format(b.harga_satuan)} jenis="angka" rata="kanan" label="harga satuan"
                      simpan={(v) => ubahSel(b.id, "harga_satuan", v, "Harga satuan")} />
                  </td>
                  <td className="tabular px-4 py-2 text-slate">
                    <SelEditable nilai={b.frekuensi} tampil={angka.format(b.frekuensi)} jenis="angka" rata="kanan" label="frekuensi"
                      simpan={(v) => ubahSel(b.id, "frekuensi", v, "Frekuensi")} />
                  </td>
                  <td className="tabular px-4 py-2 text-right text-muted">{angka.format(b.frekuensi_total)}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => hapus(b)}
                      className="rounded px-2 py-1 text-[13px] text-muted hover:bg-surface hover:text-part"
                      aria-label={`Hapus ${b.nama_barang}`}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
