import "server-only";
import { NextResponse } from "next/server";

export function jsonGalat(pesan: string, status = 400) {
  return NextResponse.json({ pesan }, { status });
}

export function jsonOk<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
