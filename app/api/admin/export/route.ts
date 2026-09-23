import { NextRequest, NextResponse } from "next/server";
import { departemenSah } from "@/lib/barang";
import { ambilSemuaBaris } from "@/lib/data";
import { buatBerkasExcel } from "@/lib/excel";
import { jsonGalat } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const departemen = req.nextUrl.searchParams.get("departemen");
  if (!departemenSah(departemen)) return jsonGalat("Departemen tidak dikenal.");

  const baris = await ambilSemuaBaris(departemen);
  const berkas = await buatBerkasExcel(departemen, baris);

  const tanggal = new Date().toISOString().slice(0, 10);
  const nama = `rekap-${departemen}-bbm-kima-${tanggal}.xlsx`;

  return new NextResponse(berkas, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nama}"`,
      "Cache-Control": "no-store",
    },
  });
}
