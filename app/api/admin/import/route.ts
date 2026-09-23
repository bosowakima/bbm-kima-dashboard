import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { departemenSah, pesanGalatDb } from "@/lib/barang";
import { rapikanDanSegarkan } from "@/lib/data";
import { bacaBerkasExcel, gabungkanBaris, peringatanTerpilih, sheetBawaan } from "@/lib/excel";
import { jsonGalat, jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 30;

const BATAS_UKURAN = 4 * 1024 * 1024; // batas unggah Vercel sekitar 4,5 MB

/**
 * Dua tahap:
 *   tahap=periksa  -> membaca berkas dan mengembalikan pratinjau, tanpa mengubah data.
 *   tahap=terapkan -> membaca ulang berkas yang sama lalu menyimpannya ke basis data.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return jsonGalat("Unggahan tidak terbaca.");

  const berkas = form.get("berkas");
  const departemen = String(form.get("departemen") ?? "");
  const tahap = String(form.get("tahap") ?? "periksa");
  const mode = String(form.get("mode") ?? "ganti");

  if (!departemenSah(departemen)) return jsonGalat("Departemen tidak dikenal.");
  if (!(berkas instanceof File)) return jsonGalat("Pilih berkas Excel terlebih dahulu.");
  if (berkas.size > BATAS_UKURAN) return jsonGalat("Ukuran berkas melebihi 4 MB. Hapus sheet yang tidak diperlukan, lalu coba lagi.");
  if (!/\.xlsx$/i.test(berkas.name)) return jsonGalat("Format berkas harus .xlsx.");
  if (mode !== "ganti" && mode !== "tambah") return jsonGalat("Mode impor tidak dikenal.");

  let hasil;
  try {
    hasil = await bacaBerkasExcel(await berkas.arrayBuffer());
  } catch (e) {
    return jsonGalat((e as Error).message);
  }

  const dikirim = form.getAll("sheet").map(String);
  const terpilih = dikirim.length > 0
    ? dikirim.filter((s) => hasil.baris[s])
    : sheetBawaan(hasil.sheet);
  if (terpilih.length === 0) return jsonGalat("Pilih minimal satu sheet untuk diimpor.");

  const baris = gabungkanBaris(hasil, terpilih);

  if (tahap === "periksa") {
    return jsonOk({
      sheet: hasil.sheet,
      terpilih,
      jumlahBaris: baris.length,
      jumlahPembelian: baris.reduce((t, b) => t + b.frekuensi, 0),
      contoh: baris.slice(0, 8),
      peringatan: peringatanTerpilih(hasil, terpilih),
    });
  }

  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);

  const { data, error } = await db.rpc("impor_departemen", {
    p_departemen: departemen,
    p_mode: mode,
    p_baris: baris,
  });
  if (error) return jsonGalat(pesanGalatDb(error), 500);

  try {
    await rapikanDanSegarkan(departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }

  return jsonOk({ jumlahBaris: baris.length, barisBaru: data as number, mode });
}
