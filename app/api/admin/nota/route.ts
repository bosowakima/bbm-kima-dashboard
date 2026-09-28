import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { pesanGalatDb, validasiNota, type Departemen } from "@/lib/barang";
import { rapikanDanSegarkan } from "@/lib/data";
import { jsonGalat, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

/** Menambah satu tanggal nota pada satu baris rekap. */
export async function POST(req: NextRequest) {
  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);

  const masukan = await req.json().catch(() => null);
  const rekapId = Number(masukan?.rekap_id);
  if (!Number.isInteger(rekapId) || rekapId <= 0) return jsonGalat("Baris barang tidak dikenal.");

  const cek = validasiNota(masukan ?? {});
  if (!cek.sah) return jsonGalat(cek.pesan);
  if (!cek.data.tanggal_nota) return jsonGalat("Tanggal nota wajib diisi.");

  const { data: induk, error: galatInduk } = await db
    .from("rekap_barang")
    .select("id, departemen")
    .eq("id", rekapId)
    .maybeSingle();
  if (galatInduk) return jsonGalat(pesanGalatDb(galatInduk), 500);
  if (!induk) return jsonGalat("Baris barang ini sudah tidak ada. Muat ulang halaman.", 404);

  const { data, error } = await db
    .from("nota_pembelian")
    .insert({ rekap_id: rekapId, ...cek.data })
    .select()
    .single();
  if (error) return jsonGalat(pesanGalatDb(error), 500);

  try {
    // Urutan varian harga bergantung pada tanggal nota terbaru, jadi dirapikan ulang.
    await rapikanDanSegarkan(induk.departemen as Departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }
  return jsonOk({ nota: data }, 201);
}
