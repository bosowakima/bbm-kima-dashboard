import { NextRequest, NextResponse } from "next/server";
import { adminSiap, buatTokenSesi, cocokkanSandi, MASA_SESI_DETIK, NAMA_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

function alihkan(req: NextRequest, jalur: string) {
  return NextResponse.redirect(new URL(jalur, req.url), { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const sandi = String(form.get("sandi") ?? "");
  const lanjutMentah = String(form.get("lanjut") ?? "/admin");
  // Hanya jalur di dalam situs ini yang boleh menjadi tujuan setelah masuk.
  const lanjut = lanjutMentah.startsWith("/admin") ? lanjutMentah : "/admin";

  if (!adminSiap()) return alihkan(req, "/admin/login?galat=belum-diatur");

  if (!(await cocokkanSandi(sandi))) {
    // Jeda singkat memperlambat percobaan menebak kata sandi.
    await new Promise((r) => setTimeout(r, 800));
    return alihkan(req, `/admin/login?galat=salah&lanjut=${encodeURIComponent(lanjut)}`);
  }

  const token = await buatTokenSesi();
  const res = alihkan(req, lanjut);
  res.cookies.set(NAMA_COOKIE, token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MASA_SESI_DETIK,
  });
  return res;
}
