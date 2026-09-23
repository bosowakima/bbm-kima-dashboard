import { getSupabase } from "./supabase";

export type Departemen = "sparepart" | "service";

export const DEPARTEMEN: Record<
  Departemen,
  { nama: string; jalur: string; ringkas: string; sumber: string }
> = {
  sparepart: {
    nama: "Sparepart",
    jalur: "/sparepart",
    ringkas: "Pembelian sparepart dari Mallomo",
    sumber:
      "Diambil dari nota bertanda biru pada rekap sparepart, periode Januari sampai Agustus 2026.",
  },
  service: {
    nama: "Service",
    jalur: "/service",
    ringkas: "Pembelian kebutuhan service",
    sumber:
      "Diambil dari seluruh nota pada rekap service, periode Januari sampai Agustus 2026.",
  },
};

export type Ringkasan = {
  departemen: Departemen;
  jumlah_baris: number;
  jumlah_barang: number;
  jumlah_pembelian: number;
  estimasi_nilai: number;
};

export type BarangRingkas = {
  departemen: Departemen;
  no_part: string;
  nama_barang: string;
  frekuensi_total: number;
  varian_harga: number;
  harga_min: number;
  harga_max: number;
  estimasi_nilai: number;
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
};

export type HasilTabel = {
  baris: BarisRekap[];
  jumlah: number;
};

export async function ambilRingkasan(): Promise<Ringkasan[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from("ringkasan_departemen").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as Ringkasan[];
}

export async function ambilBarangTeratas(
  departemen: Departemen,
  batas = 10
): Promise<BarangRingkas[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from("barang_ringkas")
    .select("*")
    .eq("departemen", departemen)
    .order("frekuensi_total", { ascending: false })
    .order("estimasi_nilai", { ascending: false })
    .limit(batas);
  if (error) throw new Error(error.message);
  return (data ?? []) as BarangRingkas[];
}

export type OpsiTabel = {
  departemen: Departemen;
  cari?: string;
  urut?: string;
  arah?: "asc" | "desc";
  halaman?: number;
  perHalaman?: number;
};

const KOLOM_URUT = new Set([
  "no_urut",
  "no_part",
  "nama_barang",
  "harga_satuan",
  "frekuensi",
  "frekuensi_total",
]);

export async function ambilTabel(opsi: OpsiTabel): Promise<HasilTabel> {
  const db = getSupabase();
  if (!db) return { baris: [], jumlah: 0 };

  const perHalaman = opsi.perHalaman ?? 25;
  const halaman = Math.max(1, opsi.halaman ?? 1);
  const urut = opsi.urut && KOLOM_URUT.has(opsi.urut) ? opsi.urut : "frekuensi_total";
  const naik = opsi.arah === "asc";

  let kueri = db
    .from("rekap_barang")
    .select("*", { count: "exact" })
    .eq("departemen", opsi.departemen);

  const cari = opsi.cari?.trim();
  if (cari) {
    const pola = `%${cari}%`;
    kueri = kueri.or(`nama_barang.ilike.${pola},no_part.ilike.${pola}`);
  }

  const dari = (halaman - 1) * perHalaman;
  const { data, count, error } = await kueri
    .order(urut, { ascending: naik })
    .order("id", { ascending: true })
    .range(dari, dari + perHalaman - 1);

  if (error) throw new Error(error.message);
  return { baris: (data ?? []) as BarisRekap[], jumlah: count ?? 0 };
}
