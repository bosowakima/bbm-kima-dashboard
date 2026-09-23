import { NextRequest, NextResponse } from "next/server";
import { NAMA_COOKIE, tokenSah } from "@/lib/auth";

const TERBUKA = new Set(["/admin/login", "/api/admin/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (TERBUKA.has(pathname)) return NextResponse.next();

  const masuk = await tokenSah(req.cookies.get(NAMA_COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!masuk) {
      return NextResponse.json({ pesan: "Sesi admin berakhir. Silakan masuk kembali." }, { status: 401 });
    }
    // Perubahan data hanya diterima dari situs ini sendiri.
    if (req.method !== "GET") {
      const asal = req.headers.get("origin");
      if (asal && new URL(asal).host !== req.nextUrl.host) {
        return NextResponse.json({ pesan: "Permintaan ditolak." }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  if (!masuk) {
    const tujuan = req.nextUrl.clone();
    tujuan.pathname = "/admin/login";
    tujuan.search = `?lanjut=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(tujuan);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
