import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { departemenSah, pesanGalatDb, validasiBarang } from "@/lib/barang";
import { rapikanDanSegarkan } from "@/lib/data";
import { jsonGalat, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

/** Menambah satu baris barang. */
export async function POST(req: NextRequest) {
  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);

  const masukan = await req.json().catch(() => null);
  if (!masukan || !departemenSah(masukan.departemen)) return jsonGalat("Departemen tidak dikenal.");

  const cek = validasiBarang(masukan);
  if (!cek.sah) return jsonGalat(cek.pesan);

  const { data, error } = await db
    .from("rekap_barang")
    .insert({
      departemen: masukan.departemen,
      ...cek.data,
      frekuensi_total: cek.data.frekuensi,
      no_urut: 0,
    })
    .select()
    .single();
  if (error) return jsonGalat(pesanGalatDb(error), error.code === "23505" ? 409 : 500);

  try {
    await rapikanDanSegarkan(masukan.departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }
  return jsonOk({ baris: data }, 201);
}
