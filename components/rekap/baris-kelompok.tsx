"use client";

import { useMemo, useState } from "react";
import { kunciBarang, type BarisRekap } from "@/lib/barang";
import { petaWarna, type WarnaKelompok } from "@/lib/kelompok";

/**
 * Status bersama untuk tabel yang barisnya dikelompokkan per barang:
 * warna tiap kelompok, baris yang sedang dibuka, dan kelompok yang sedang disorot kursor.
 */
export function useKelompok(baris: BarisRekap[]) {
  const warna = useMemo(() => petaWarna(baris), [baris]);
  const [terbuka, setTerbuka] = useState<Set<number>>(new Set());
  const [sorot, setSorot] = useState<{ kunci: string; id: number } | null>(null);

  function info(b: BarisRekap) {
    const kunci = kunciBarang(b.no_part, b.nama_barang);
    const w = warna.get(kunci) as WarnaKelompok;
    const disorot = sorot?.kunci === kunci;
    return {
      kunci,
      warna: w,
      buka: terbuka.has(b.id),
      /** Baris ini adalah baris yang sedang ditunjuk kursor. */
      ditunjuk: sorot?.id === b.id,
      disorot,
      latar: disorot ? w.kuat : w.latar,
    };
  }

  function alih(id: number) {
    setTerbuka((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  function penunjuk(b: BarisRekap) {
    const kunci = kunciBarang(b.no_part, b.nama_barang);
    return {
      onMouseEnter: () => setSorot({ kunci, id: b.id }),
      onMouseLeave: () => setSorot((s) => (s?.id === b.id ? null : s)),
    };
  }

  const semuaTerbuka = baris.length > 0 && baris.every((b) => terbuka.has(b.id));
  function alihSemua() {
    setTerbuka(semuaTerbuka ? new Set() : new Set(baris.map((b) => b.id)));
  }

  return { info, alih, penunjuk, semuaTerbuka, alihSemua };
}

export function Panah({ buka }: { buka: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      className={`transition-transform duration-150 ${buka ? "rotate-180" : ""}`}
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Nama barang dengan efek stabilo saat barisnya ditunjuk kursor. */
export function NamaDisorot({ teks, aktif }: { teks: string; aktif: boolean }) {
  return (
    <span
      data-sorot={aktif ? "ya" : undefined}
      className={`-mx-1 rounded px-1 py-px ${aktif ? "bg-[#FFE27A] text-ink" : ""}`}
    >
      {teks}
    </span>
  );
}
