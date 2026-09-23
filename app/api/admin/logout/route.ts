import { NextRequest, NextResponse } from "next/server";
import { NAMA_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login?keluar=1", req.url), { status: 303 });
  res.cookies.set(NAMA_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
