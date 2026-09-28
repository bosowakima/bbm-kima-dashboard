import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { pesanGalatDb, type Departemen } from "@/lib/barang";
import { rapikanDanSegarkan } from "@/lib/data";
import { jsonGalat, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

/** Menghapus satu tanggal nota. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabase();
  if (!db) return jsonGalat("Koneksi Supabase belum diatur di server.", 500);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return jsonGalat("Nomor nota tidak sah.");

  const { data, error } = await db
    .from("nota_pembelian")
    .delete()
    .eq("id", id)
    .select("rekap:rekap_barang(departemen)")
    .maybeSingle();
  if (error) return jsonGalat(pesanGalatDb(error), 500);
  if (!data) return jsonGalat("Nota ini sudah tidak ada. Muat ulang halaman.", 404);

  const departemen = (data.rekap as unknown as { departemen: Departemen } | null)?.departemen;
  try {
    if (departemen) await rapikanDanSegarkan(departemen);
  } catch (e) {
    return jsonGalat(pesanGalatDb(e as { code?: string; message: string }), 500);
  }
  return jsonOk({ terhapus: id });
}
