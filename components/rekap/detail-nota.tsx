"use client";

import { useState } from "react";
import type { BarisRekap } from "@/lib/barang";
import { tampilTanggal, type WarnaKelompok } from "@/lib/kelompok";
import { formatAngka, formatRupiah } from "@/lib/format";

type Props = {
  id: string;
  baris: BarisRekap;
  warna: WarnaKelompok;
  /** Diisi hanya di halaman Admin. Mengembalikan pesan galat, atau null bila berhasil. */
  tambahNota?: (isi: { tanggal_nota: string; no_gr: string; qty: string }) => Promise<string | null>;
  hapusNota?: (notaId: number, tanggal: string) => Promise<string | null>;
};

export default function DetailNota({ id, baris, warna, tambahNota, hapusNota }: Props) {
  const [draf, setDraf] = useState({ tanggal_nota: "", no_gr: "", qty: "" });
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const nota = baris.nota;
  const tercatat = nota.length;
  const kurang = baris.frekuensi - tercatat;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!tambahNota) return;
    setSibuk(true);
    const hasil = await tambahNota(draf);
    setSibuk(false);
    setGalat(hasil);
    if (!hasil) setDraf({ tanggal_nota: "", no_gr: "", qty: "" });
  }

  const kolom = "px-3 py-2";
  const input = "h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink";

  return (
    // Di layar sempit tabel dapat digeser ke samping; panel detail tetap menempel di kiri
    // dan selebar layar supaya daftar tanggal tidak ikut terpotong.
    <div
      id={id}
      className="sticky left-0 max-w-[calc(100vw-5.5rem)] border-l-4 px-4 py-4 sm:max-w-none sm:px-6"
      style={{ borderColor: warna.garis }}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
        <div>
          <dt className="text-[12px] text-muted">No. part</dt>
          <dd className="font-mono text-[13px] text-ink">{baris.no_part}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[12px] text-muted">Harga satuan</dt>
          <dd className="tabular text-ink">{formatRupiah(baris.harga_satuan)}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Dibeli pada harga ini</dt>
          <dd className="tabular text-ink">{formatAngka(baris.frekuensi)} kali</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Semua varian harga</dt>
          <dd className="tabular text-ink">{formatAngka(baris.frekuensi_total)} kali</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Estimasi nilai pada harga ini</dt>
          <dd className="tabular text-ink">{formatRupiah(baris.harga_satuan * baris.frekuensi)}</dd>
        </div>
      </dl>

      <h3 className="mt-5 text-[13px] font-medium text-slate">
        Riwayat nota, terbaru di atas
      </h3>

      {tercatat === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Belum ada tanggal nota untuk barang ini.
          {tambahNota ? " Tambahkan lewat formulir di bawah." : ""}
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-md border border-line bg-panel">
          <table className="w-full min-w-[300px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className={`${kolom} w-10 font-medium`}>#</th>
                <th scope="col" className={`${kolom} font-medium`}>Tanggal nota</th>
                <th scope="col" className={`${kolom} font-medium`}>No. GR</th>
                <th scope="col" className={`${kolom} text-right font-medium`}>Qty</th>
                {hapusNota ? <th scope="col" className={kolom}><span className="sr-only">Aksi</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {nota.map((n, i) => (
                <tr key={n.id} className="border-b border-line last:border-0">
                  <td className={`${kolom} tabular text-muted`}>{i + 1}</td>
                  <td className={`${kolom} ${n.tanggal_nota ? "text-ink" : "italic text-muted"}`}>
                    {tampilTanggal(n.tanggal_nota, true)}
                  </td>
                  <td className={`${kolom} font-mono text-slate`}>{n.no_gr ?? "—"}</td>
                  <td className={`${kolom} tabular text-right text-slate`}>
                    {n.qty === null ? "—" : formatAngka(n.qty)}
                  </td>
                  {hapusNota ? (
                    <td className={`${kolom} text-right`}>
                      <button
                        type="button"
                        onClick={async () => setGalat(await hapusNota(n.id, tampilTanggal(n.tanggal_nota)))}
                        className="rounded px-2 py-0.5 text-muted hover:bg-surface hover:text-part"
                        aria-label={`Hapus nota ${tampilTanggal(n.tanggal_nota)}`}
                      >
                        Hapus
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {kurang > 0 && tercatat > 0 ? (
        <p className="mt-2 text-[13px] text-muted">
          Tanggal nota tercatat untuk {formatAngka(tercatat)} dari {formatAngka(baris.frekuensi)} pembelian.
        </p>
      ) : null}
      {kurang < 0 ? (
        <p className="mt-2 text-[13px] text-muted">
          Jumlah nota ({formatAngka(tercatat)}) lebih banyak dari frekuensi ({formatAngka(baris.frekuensi)}).
          {tambahNota ? " Sesuaikan frekuensi pada tabel bila diperlukan." : ""}
        </p>
      ) : null}

      {tambahNota ? (
        <form onSubmit={kirim} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-[12px] text-muted">
            Tanggal nota
            <input
              type="date"
              required
              value={draf.tanggal_nota}
              onChange={(e) => setDraf({ ...draf, tanggal_nota: e.target.value })}
              className={`${input} mt-1 block`}
            />
          </label>
          <label className="text-[12px] text-muted">
            No. GR
            <input
              value={draf.no_gr}
              placeholder="Boleh kosong"
              onChange={(e) => setDraf({ ...draf, no_gr: e.target.value })}
              className={`${input} mt-1 block w-44 font-mono`}
            />
          </label>
          <label className="text-[12px] text-muted">
            Qty
            <input
              inputMode="numeric"
              value={draf.qty}
              placeholder="Boleh kosong"
              onChange={(e) => setDraf({ ...draf, qty: e.target.value })}
              className={`${input} mt-1 block w-28 text-right`}
            />
          </label>
          <button
            type="submit"
            disabled={sibuk}
            className="h-9 rounded-md border border-line bg-panel px-3 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
          >
            {sibuk ? "Menambahkan…" : "Tambah tanggal nota"}
          </button>
          {galat ? <p role="alert" className="basis-full text-[13px] text-part">{galat}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
