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
  return error.message;
}
