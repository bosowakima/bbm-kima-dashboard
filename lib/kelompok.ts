import { kunciBarang, type BarisRekap, type Nota } from "./barang";

/**
 * Warna latar lembut untuk membedakan kelompok barang.
 * Satu kelompok = nomor part yang sama (atau nama barang yang sama bila nomor part kosong),
 * sehingga varian harga dari barang yang sama selalu berwarna sama.
 */
export const WARNA_KELOMPOK = [
  { latar: "#FDF0F2", kuat: "#F9DDE2", garis: "#E7A9B4" }, // mawar
  { latar: "#EEF4FB", kuat: "#DCE8F6", garis: "#9DBDE0" }, // biru
  { latar: "#EEF7F0", kuat: "#DAEEDF", garis: "#9FCCAA" }, // hijau
  { latar: "#FFF6E5", kuat: "#FDEBC6", garis: "#E3C27F" }, // kuning
  { latar: "#F4F0FB", kuat: "#E6DDF6", garis: "#B7A5DE" }, // ungu
  { latar: "#ECF7F7", kuat: "#D6EEEE", garis: "#93C9C9" }, // toska
  { latar: "#F8F2EC", kuat: "#EFE2D5", garis: "#CDAE90" }, // pasir
  { latar: "#F1F3F6", kuat: "#E1E5EB", garis: "#AAB4C2" }, // abu
] as const;

export type WarnaKelompok = (typeof WARNA_KELOMPOK)[number];

function hash(teks: string): number {
  let h = 2166136261;
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Menentukan warna setiap kelompok menurut urutan tampil.
 * Warna diturunkan dari kunci barang agar tetap sama di halaman mana pun,
 * lalu digeser bila sama dengan kelompok tepat di atasnya.
 */
export function petaWarna(baris: Pick<BarisRekap, "no_part" | "nama_barang">[]): Map<string, WarnaKelompok> {
  const peta = new Map<string, WarnaKelompok>();
  let sebelumnya: WarnaKelompok | null = null;
  for (const b of baris) {
    const k = kunciBarang(b.no_part, b.nama_barang);
    let warna = peta.get(k);
    if (!warna) {
      let i = hash(k) % WARNA_KELOMPOK.length;
      if (WARNA_KELOMPOK[i] === sebelumnya) i = (i + 1) % WARNA_KELOMPOK.length;
      warna = WARNA_KELOMPOK[i];
      peta.set(k, warna);
    }
    sebelumnya = warna;
  }
  return peta;
}

const fmtTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const fmtTanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function tampilTanggal(iso: string | null, panjang = false): string {
  if (!iso) return "Tanggal tidak tercatat";
  const d = new Date(`${iso}T00:00:00Z`);
  return (panjang ? fmtTanggalPanjang : fmtTanggal).format(d);
}

/** Kalimat ringkas di bawah nama barang, misalnya "Nota terakhir 31 Agu 2026 · 6 nota". */
export function ringkasNota(nota: Nota[]): string {
  if (nota.length === 0) return "Belum ada tanggal nota";
  const terbaru = nota.find((n) => n.tanggal_nota)?.tanggal_nota ?? null;
  const awal = terbaru ? `Nota terakhir ${tampilTanggal(terbaru)}` : "Tanggal nota tidak tercatat";
  return nota.length > 1 ? `${awal} · ${nota.length} nota` : awal;
}
