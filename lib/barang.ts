/**
 * Aturan data barang yang dipakai bersama oleh halaman, API, dan impor Excel.
 * Berkas ini tidak memakai kunci rahasia, sehingga aman dipakai di peramban.
 */

export const DAFTAR_DEPARTEMEN = ["sparepart", "service"] as const;
export type Departemen = (typeof DAFTAR_DEPARTEMEN)[number];

export function departemenSah(nilai: unknown): nilai is Departemen {
  return typeof nilai === "string" && (DAFTAR_DEPARTEMEN as readonly string[]).includes(nilai);
}

/** Merapikan teks: huruf besar, spasi ganda dipadatkan, spasi tepi dibuang. */
export function rapikanTeks(nilai: unknown): string {
  return String(nilai ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function rapikanNoPart(nilai: unknown): string {
  const teks = rapikanTeks(nilai);
  return teks === "" || teks === "–" || teks === "NONE" || teks === "0" ? "-" : teks;
}

/** Kunci barang: NO. PART bila ada, selain itu NAMA BARANG. Sama dengan fungsi kunci_barang di SQL. */
export function kunciBarang(noPart: string, nama: string): string {
  const part = rapikanNoPart(noPart);
  return part === "-" ? `N|${rapikanTeks(nama)}` : `P|${part}`;
}

export type Nota = {
  id: number;
  /** Format ISO "2026-08-31", atau null bila tanggal tidak tercatat di nota. */
  tanggal_nota: string | null;
  no_gr: string | null;
  qty: number | null;
};

export type BarisRekap = {
  id: number;
  departemen: Departemen;
  no_urut: number;
  no_part: string;
  nama_barang: string;
  harga_satuan: number;
  frekuensi: number;
  frekuensi_total: number;
  nota: Nota[];
};

export type InputNota = {
  tanggal_nota: string | null;
  no_gr: string | null;
  qty: number | null;
};

/**
 * Membaca tanggal dari berbagai bentuk penulisan dan mengembalikan format ISO.
 * Menerima Date, "2026-08-31", "31/08/2026", "31-8-26", dan "'31/08/2026" (tanda kutip awal dari Excel).
 * Tahun yang jelas salah ketik seperti "02026" atau "206" dibaca sebagai 2026.
 */
export function bacaTanggal(nilai: unknown): string | null {
  if (nilai === null || nilai === undefined || nilai === "") return null;
  if (nilai instanceof Date) {
    if (Number.isNaN(nilai.getTime())) return null;
    const y = nilai.getUTCFullYear();
    // Tahun "206" adalah salah ketik 2026 yang tersimpan sebagai tanggal Excel.
    if (y >= 200 && y <= 209) {
      return bacaTanggal(`${y - 200 + 2020}-${nilai.getUTCMonth() + 1}-${nilai.getUTCDate()}`);
    }
    return nilai.toISOString().slice(0, 10);
  }
  const teks = String(nilai).trim().replace(/^'+/, "");
  let m = teks.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  let y: number, bln: number, h: number;
  if (m) {
    [y, bln, h] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else {
    m = teks.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,5})$/);
    if (!m) return null;
    [h, bln, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (m[3].length === 5 && m[3].startsWith("0")) y = Number(m[3].slice(1)); // "02026" -> 2026
    if (y < 100) y += 2000;
    if (y >= 200 && y <= 209) y = y - 200 + 2020; // "206" -> 2026
  }
  const d = new Date(Date.UTC(y, bln - 1, h));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== bln - 1 || d.getUTCDate() !== h) return null;
  return d.toISOString().slice(0, 10);
}

export type HasilValidasiNota =
  | { sah: true; data: InputNota }
  | { sah: false; pesan: string };

export function validasiNota(masukan: Partial<Record<keyof InputNota, unknown>>): HasilValidasiNota {
  const mentah = masukan.tanggal_nota;
  const tanggal = bacaTanggal(mentah);
  if (mentah !== null && mentah !== undefined && String(mentah).trim() !== "" && !tanggal) {
    return { sah: false, pesan: "Tanggal nota tidak dikenali. Gunakan format 31/08/2026." };
  }
  const noGr = String(masukan.no_gr ?? "").replace(/\s+/g, " ").trim().toUpperCase();
  if (noGr.length > 60) return { sah: false, pesan: "Nomor GR paling panjang 60 karakter." };
  const qtyTeks = String(masukan.qty ?? "").trim().replace(",", ".");
  const qty = qtyTeks === "" ? null : Number(qtyTeks);
  if (qty !== null && (!Number.isFinite(qty) || qty < 0)) {
    return { sah: false, pesan: "Qty harus berupa angka, 0 atau lebih." };
  }
  return { sah: true, data: { tanggal_nota: tanggal, no_gr: noGr || null, qty } };
}

export type InputBarang = {
  no_part: string;
  nama_barang: string;
  harga_satuan: number;
  frekuensi: number;
};

export type HasilValidasi =
  | { sah: true; data: InputBarang }
  | { sah: false; pesan: string };

function keAngka(nilai: unknown): number {
  if (typeof nilai === "number") return nilai;
  // Menerima penulisan "Rp 1.250.000" maupun "1250000".
  const bersih = String(nilai ?? "").replace(/[^0-9,-]/g, "").replace(",", ".");
  return bersih === "" ? NaN : Number(bersih);
}

export function validasiBarang(masukan: Partial<Record<keyof InputBarang, unknown>>): HasilValidasi {
  const nama = rapikanTeks(masukan.nama_barang);
  if (!nama) return { sah: false, pesan: "Nama barang wajib diisi." };
  if (nama.length > 200) return { sah: false, pesan: "Nama barang paling panjang 200 karakter." };

  const noPart = rapikanNoPart(masukan.no_part);
  if (noPart.length > 60) return { sah: false, pesan: "Nomor part paling panjang 60 karakter." };

  const harga = keAngka(masukan.harga_satuan);
  if (!Number.isFinite(harga) || harga < 0 || !Number.isInteger(harga)) {
    return { sah: false, pesan: "Harga satuan harus berupa bilangan bulat, 0 atau lebih." };
  }

  const frek = keAngka(masukan.frekuensi ?? 1);
  if (!Number.isFinite(frek) || frek < 1 || !Number.isInteger(frek)) {
    return { sah: false, pesan: "Frekuensi harus berupa bilangan bulat, minimal 1." };
  }

  return { sah: true, data: { no_part: noPart, nama_barang: nama, harga_satuan: harga, frekuensi: frek } };
}

/** Menerjemahkan pesan galat basis data menjadi kalimat yang dapat ditindaklanjuti. */
export function pesanGalatDb(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Barang dengan nomor part (atau nama, bila nomor part kosong) dan harga satuan ini sudah ada. Ubah harganya, atau tambahkan frekuensi pada baris yang sudah ada.";
  }
  if (error.code === "42501") {
    return "Server tidak memiliki izin ke tabel rekap_barang. Jalankan ulang berkas supabase/01_schema.sql, lalu pastikan SUPABASE_SERVICE_ROLE_KEY berisi secret key, bukan anon atau publishable key.";
  }
  if (error.code === "PGRST202" || error.code === "42883") {
    return "Fungsi basis data belum tersedia. Jalankan seluruh isi berkas supabase/01_schema.sql versi terbaru.";
  }
  if (error.code === "PGRST200" || error.code === "42P01" || /nota_pembelian/.test(error.message)) {
    return "Tabel nota_pembelian belum ada. Jalankan seluruh isi berkas supabase/01_schema.sql versi 3, lalu muat ulang halaman.";
  }
  return error.message;
}
