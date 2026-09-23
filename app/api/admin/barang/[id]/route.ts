import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { pesanGalatDb, validasiBarang, type Departemen } from "@/lib/barang";
import { rapikanDanSegarkan } from "@/lib/data";
import { jsonGalat, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

const KOLOM_BOLEH_UBAH = ["no_part", "nama_barang", "harga_satuan", "frekuensi"] as const;

function idDari(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Mengubah satu atau beberapa kolom pada satu baris. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);
  const id = idDari(params);
  if (!id) return jsonGalat("Nomor baris tidak sah.");

  const ubahan = await req.json().catch(() => null);
  if (!ubahan || typeof ubahan !== "object") return jsonGalat("Isi perubahan tidak terbaca.");

  const { data: lama, error: galatBaca } = await db
    .from("rekap_barang")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (galatBaca) return jsonGalat(pesanGalatDb(galatBaca), 500);
  if (!lama) return jsonGalat("Baris ini sudah tidak ada. Muat ulang halaman.", 404);

  // Nilai lama dipakai untuk kolom yang tidak diubah, lalu seluruhnya divalidasi ulang.
  const gabungan: Record<string, unknown> = {};
  for (const k of KOLOM_BOLEH_UBAH) gabungan[k] = k in ubahan ? ubahan[k] : lama[k];
  const cek = validasiBarang(gabungan);
  if (!cek.sah) return jsonGalat(cek.pesan);

  const { data, error } = await db
    .from("rekap_barang")
    .update(cek.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return jsonGalat(pesanGalatDb(error), error.code === "23505" ? 409 : 500);

  try {
    await rapikanDanSegarkan(lama.departemen as Departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }
  return jsonOk({ baris: data });
}

/** Menghapus satu baris. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);
  const id = idDari(params);
  if (!id) return jsonGalat("Nomor baris tidak sah.");

  const { data, error } = await db
    .from("rekap_barang")
    .delete()
    .eq("id", id)
    .select("departemen")
    .maybeSingle();
  if (error) return jsonGalat(pesanGalatDb(error), 500);
  if (!data) return jsonGalat("Baris ini sudah tidak ada. Muat ulang halaman.", 404);

  try {
    await rapikanDanSegarkan(data.departemen as Departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }
  return jsonOk({ terhapus: id });
}
