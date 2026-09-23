"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  nilai: string | number;
  tampil: string;
  jenis: "teks" | "angka";
  label: string;
  rata?: "kiri" | "kanan";
  mono?: boolean;
  /** Mengembalikan pesan galat, atau null bila berhasil. */
  simpan: (nilaiBaru: string) => Promise<string | null>;
};

/**
 * Sel tabel yang dapat diubah langsung. Klik untuk mengubah,
 * Enter atau klik di luar sel untuk menyimpan, Esc untuk membatalkan.
 */
export default function SelEditable({ nilai, tampil, jenis, label, rata = "kiri", mono, simpan }: Props) {
  const [ubah, setUbah] = useState(false);
  const [draf, setDraf] = useState(String(nilai));
  const [status, setStatus] = useState<"diam" | "menyimpan" | "galat">("diam");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ubah) setDraf(String(nilai));
  }, [nilai, ubah]);

  useEffect(() => {
    if (ubah) input.current?.select();
  }, [ubah]);

  async function selesai() {
    if (status === "menyimpan") return;
    if (draf.trim() === String(nilai).trim()) {
      setUbah(false);
      setStatus("diam");
      return;
    }
    setStatus("menyimpan");
    const galat = await simpan(draf);
    if (galat) {
      setStatus("galat");
      input.current?.focus();
      return;
    }
    setStatus("diam");
    setUbah(false);
  }

  const rataKelas = rata === "kanan" ? "text-right" : "text-left";

  if (!ubah) {
    return (
      <button
        type="button"
        onClick={() => setUbah(true)}
        aria-label={`Ubah ${label}: ${tampil}`}
        className={`-mx-2 block w-[calc(100%+1rem)] rounded px-2 py-1 ${rataKelas} ${
          mono ? "font-mono text-[13px]" : ""
        } hover:bg-surface hover:outline hover:outline-1 hover:outline-line`}
      >
        {tampil}
      </button>
    );
  }

  return (
    <input
      ref={input}
      value={draf}
      inputMode={jenis === "angka" ? "numeric" : "text"}
      aria-label={label}
      aria-invalid={status === "galat"}
      disabled={status === "menyimpan"}
      onChange={(e) => {
        setDraf(e.target.value);
        if (status === "galat") setStatus("diam");
      }}
      onBlur={selesai}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          selesai();
        }
        if (e.key === "Escape") {
          setDraf(String(nilai));
          setStatus("diam");
          setUbah(false);
        }
      }}
      className={`-mx-2 w-[calc(100%+1rem)] rounded border px-2 py-1 ${rataKelas} ${
        mono ? "font-mono text-[13px]" : ""
      } ${status === "galat" ? "border-part" : "border-slate"} ${
        status === "menyimpan" ? "opacity-60" : ""
      } bg-panel text-ink`}
    />
  );
}
