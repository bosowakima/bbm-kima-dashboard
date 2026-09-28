"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { BarisRekap } from "@/lib/barang";
import { ringkasNota } from "@/lib/kelompok";
import { formatAngka, formatRupiah } from "@/lib/format";
import DetailNota from "./detail-nota";
import { NamaDisorot, Panah, useKelompok } from "./baris-kelompok";

export type JudulKolom = {
  kunci: string;
  label: string;
  rata: "text-left" | "text-right";
  href: string;
  aktif: boolean;
  arah: "asc" | "desc";
};

export default function TabelRekapPublik({ baris, judul }: { baris: BarisRekap[]; judul: JudulKolom[] }) {
  const { info, alih, penunjuk, semuaTerbuka, alihSemua } = useKelompok(baris);
  const jumlahKolom = judul.length + 1;

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[760px] border-collapse bg-panel text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[13px] text-muted">
            <th scope="col" className="w-10 px-2 py-3">
              <button
                type="button"
                onClick={alihSemua}
                className="grid h-7 w-7 place-items-center rounded text-slate hover:bg-surface hover:text-ink"
                aria-label={semuaTerbuka ? "Tutup semua detail" : "Buka semua detail"}
                title={semuaTerbuka ? "Tutup semua detail" : "Buka semua detail"}
              >
                <Panah buka={semuaTerbuka} />
              </button>
            </th>
            {judul.map((k) => (
              <th key={k.kunci} scope="col" className={`px-4 py-3 font-medium ${k.rata}`}>
                <Link href={k.href} className={`hover:text-ink ${k.aktif ? "text-ink" : ""}`}>
                  {k.label}
                  {k.aktif ? (k.arah === "desc" ? " ↓" : " ↑") : ""}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.length === 0 ? (
            <tr>
              <td colSpan={jumlahKolom} className="px-4 py-10 text-center text-muted">
                Tidak ada barang yang cocok dengan pencarian ini. Coba kata kunci yang lebih pendek.
              </td>
            </tr>
          ) : (
            baris.map((b) => {
              const i = info(b);
              const idDetail = `detail-${b.id}`;
              return (
                <Fragment key={b.id}>
                  <tr
                    {...penunjuk(b)}
                    style={{ backgroundColor: i.latar }}
                    className="border-b border-white/70 transition-colors duration-100"
                  >
                    <td className="px-2 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => alih(b.id)}
                        aria-expanded={i.buka}
                        aria-controls={idDetail}
                        aria-label={`${i.buka ? "Tutup" : "Lihat"} detail ${b.nama_barang}`}
                        className="mt-0.5 grid h-7 w-7 place-items-center rounded text-slate hover:bg-white/70 hover:text-ink"
                      >
                        <Panah buka={i.buka} />
                      </button>
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-[13px] text-slate">{b.no_part}</td>
                    <td className="px-4 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => alih(b.id)}
                        className="text-left text-ink"
                        tabIndex={-1}
                      >
                        <NamaDisorot teks={b.nama_barang} aktif={i.ditunjuk} />
                      </button>
                      <span className="mt-0.5 block text-[12px] leading-4 text-muted">{ringkasNota(b.nota)}</span>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right align-top text-ink">{formatRupiah(b.harga_satuan)}</td>
                    <td className="tabular px-4 py-2.5 text-right align-top text-slate">{formatAngka(b.frekuensi)}</td>
                    <td className="tabular px-4 py-2.5 text-right align-top text-slate">{formatAngka(b.frekuensi_total)}</td>
                  </tr>
                  {i.buka ? (
                    <tr style={{ backgroundColor: i.warna.latar }} className="border-b border-line">
                      <td colSpan={jumlahKolom} className="p-0">
                        <DetailNota id={idDetail} baris={b} warna={i.warna} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
