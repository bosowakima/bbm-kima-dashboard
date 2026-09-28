import "server-only";
import { revalidatePath } from "next/cache";
import { getSupabase } from "./supabase";
import { DAFTAR_DEPARTEMEN, pesanGalatDb, type Departemen } from "./barang";
import { DEPARTEMEN } from "./departemen";

export { DEPARTEMEN };
export type { Departemen };

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

export type { Nota, BarisRekap } from "./barang";
import type { BarisRekap, Nota } from "./barang";

/** Kolom yang diambil dari Supabase: baris rekap beserta seluruh tanggal notanya. */
const PILIH = "*, nota:nota_pembelian(id, tanggal_nota, no_gr, qty)";

/** Tanggal terbaru di atas; nota tanpa tanggal di paling bawah. */
export function urutkanNota(nota: Nota[] | null | undefined): Nota[] {
  return [...(nota ?? [])].sort((a, b) => {
    if (a.tanggal_nota === b.tanggal_nota) return b.id - a.id;
    if (!a.tanggal_nota) return 1;
    if (!b.tanggal_nota) return -1;
    return a.tanggal_nota < b.tanggal_nota ? 1 : -1;
  });
}

function rapikanBaris(data: unknown[] | null): BarisRekap[] {
  return ((data ?? []) as BarisRekap[]).map((b) => ({ ...b, nota: urutkanNota(b.nota) }));
}

export type HasilTabel = {
  baris: BarisRekap[];
  jumlah: number;
  /** Halaman yang benar-benar ditampilkan; bisa lebih kecil dari yang diminta. */
  halaman: number;
  totalHalaman: number;
};

/**
 * Membaca seluruh baris satu departemen langsung dari tabel rekap_barang.
 * Ringkasan dan daftar barang teratas dihitung di sini, sehingga dashboard
 * hanya membutuhkan izin baca pada satu tabel dan tidak bergantung pada view.
 * Data diambil per 1.000 baris karena itulah batas bawaan Supabase per permintaan.
 */
async function ambilBarisDepartemen(departemen: Departemen): Promise<BarisRekap[]> {
  const db = getSupabase();
  if (!db) return [];

  const UKURAN = 1000;
  const semua: BarisRekap[] = [];
  for (let dari = 0; ; dari += UKURAN) {
    const { data, error } = await db
      .from("rekap_barang")
      .select(PILIH)
      .eq("departemen", departemen)
      .order("id", { ascending: true })
      .range(dari, dari + UKURAN - 1);
    if (error) throw new Error(pesanGalatDb(error));
    const potongan = rapikanBaris(data);
    semua.push(...potongan);
    if (potongan.length < UKURAN) break;
  }
  return semua;
}

function hitungRingkasan(departemen: Departemen, baris: BarisRekap[]): Ringkasan {
  return {
    departemen,
    jumlah_baris: baris.length,
    jumlah_barang: new Set(baris.map((b) => `${b.no_part}|${b.nama_barang}`)).size,
    jumlah_pembelian: baris.reduce((total, b) => total + b.frekuensi, 0),
    estimasi_nilai: baris.reduce((total, b) => total + b.harga_satuan * b.frekuensi, 0),
  };
}

export async function ambilRingkasan(): Promise<Ringkasan[]> {
  const daftar = [...DAFTAR_DEPARTEMEN];
  const hasil = await Promise.all(daftar.map((d) => ambilBarisDepartemen(d)));
  return daftar.map((d, i) => hitungRingkasan(d, hasil[i]));
}

export async function ambilBarangTeratas(
  departemen: Departemen,
  batas = 10
): Promise<BarangRingkas[]> {
  const baris = await ambilBarisDepartemen(departemen);

  const perBarang = new Map<string, BarangRingkas>();
  for (const b of baris) {
    const kunci = `${b.no_part}|${b.nama_barang}`;
    const kini = perBarang.get(kunci) ?? {
      departemen,
      no_part: b.no_part,
      nama_barang: b.nama_barang,
      frekuensi_total: 0,
      varian_harga: 0,
      harga_min: b.harga_satuan,
      harga_max: b.harga_satuan,
      estimasi_nilai: 0,
    };
    kini.frekuensi_total += b.frekuensi;
    kini.varian_harga += 1;
    kini.harga_min = Math.min(kini.harga_min, b.harga_satuan);
    kini.harga_max = Math.max(kini.harga_max, b.harga_satuan);
    kini.estimasi_nilai += b.harga_satuan * b.frekuensi;
    perBarang.set(kunci, kini);
  }

  return Array.from(perBarang.values())
    .sort(
      (a, b) =>
        b.frekuensi_total - a.frekuensi_total || b.estimasi_nilai - a.estimasi_nilai
    )
    .slice(0, batas);
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
  if (!db) return { baris: [], jumlah: 0, halaman: 1, totalHalaman: 1 };

  const perHalaman = opsi.perHalaman ?? 25;
  const diminta = Math.max(1, Math.floor(opsi.halaman ?? 1) || 1);
  // Urutan bawaan memakai no_urut: frekuensi total terbesar di atas, varian harga dari
  // barang yang sama berdampingan, dan varian dengan nota terbaru paling atas.
  const urut = opsi.urut && KOLOM_URUT.has(opsi.urut) ? opsi.urut : "no_urut";
  const naik = urut === "no_urut" ? opsi.arah !== "desc" : opsi.arah === "asc";

  // Tanda baca yang punya arti khusus pada filter Supabase dibuang dari kata kunci.
  const cari = opsi.cari?.replace(/[,()*%\\:"]/g, " ").trim();

  const ambil = (halaman: number) => {
    let kueri = db
      .from("rekap_barang")
      .select(PILIH, { count: "exact" })
      .eq("departemen", opsi.departemen);
    if (cari) {
      const pola = `%${cari}%`;
      kueri = kueri.or(`nama_barang.ilike.${pola},no_part.ilike.${pola}`);
    }
    const dari = (halaman - 1) * perHalaman;
    return kueri
      .order(urut, { ascending: naik })
      .order("no_urut", { ascending: true })
      .order("id", { ascending: true })
      .range(dari, dari + perHalaman - 1);
  };

  let halaman = diminta;
  let { data, count, error, status } = await ambil(halaman);

  // Nomor halaman melebihi jumlah data: Supabase menolaknya dengan status 416 (kode PGRST103)
  // atau mengembalikan daftar kosong. Dalam kedua kasus, halaman terakhir yang ditampilkan.
  const diLuarRentang = status === 416 || error?.code === "PGRST103";
  if (diLuarRentang || (!error && (data?.length ?? 0) === 0 && halaman > 1)) {
    let jumlah = diLuarRentang ? null : count ?? null;
    if (jumlah === null) {
      let hitung = db.from("rekap_barang").select("id", { count: "exact", head: true }).eq("departemen", opsi.departemen);
      if (cari) hitung = hitung.or(`nama_barang.ilike.%${cari}%,no_part.ilike.%${cari}%`);
      const h = await hitung;
      if (h.error) throw new Error(pesanGalatDb(h.error));
      jumlah = h.count ?? 0;
    }
    halaman = Math.max(1, Math.ceil(jumlah / perHalaman));
    ({ data, count, error } = await ambil(halaman));
  }

  if (error) throw new Error(pesanGalatDb(error));
  const jumlah = count ?? 0;
  return {
    baris: rapikanBaris(data),
    jumlah,
    halaman,
    totalHalaman: Math.max(1, Math.ceil(jumlah / perHalaman)),
  };
}

/** Seluruh baris satu departemen, diurutkan seperti di Excel. Dipakai untuk ekspor. */
export async function ambilSemuaBaris(departemen: Departemen): Promise<BarisRekap[]> {
  const baris = await ambilBarisDepartemen(departemen);
  return [...baris].sort((a, b) => a.no_urut - b.no_urut || a.id - b.id);
}

/** Memperbarui frekuensi total dan nomor urut, lalu menyegarkan halaman publik. */
export async function rapikanDanSegarkan(departemen: Departemen): Promise<void> {
  const db = getSupabase();
  if (db) {
    const { error } = await db.rpc("rapikan_departemen", { p_departemen: departemen });
    if (error) throw error;
  }
  revalidatePath("/");
  revalidatePath(DEPARTEMEN[departemen].jalur);
  revalidatePath(`/admin/${departemen}`);
}
